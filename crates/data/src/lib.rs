pub mod backup;
pub mod db;
pub mod error;
pub mod migrations;
pub mod models;
pub mod repo;
pub mod seed;

pub use db::Db;
pub use error::{Error, Result};
pub use seed::{seed_all, seed_pack};
pub use models::{
    Mastery, NewMastery, NewNote, NewPracticeAttempt, NewProblemTemplate, NewReviewSchedule,
    NewTopic, Note, PracticeAttempt, ProblemTemplate, ReviewSchedule, Setting, Topic,
};
pub use repo::{
    MasteryRepo, NotesRepo, PracticeAttemptsRepo, ProblemTemplatesRepo, ReviewScheduleRepo,
    SettingsRepo, TopicsRepo,
};

#[cfg(test)]
mod tests {
    use super::*;
    use crate::backup::{export_json, import_json};
    use crate::repo::topics::has_cycle;
    use crate::seed::seed_all;

    fn make_topic(id: &str, slug: &str) -> NewTopic {
        NewTopic {
            id: id.to_string(),
            slug: slug.to_string(),
            title: slug.to_string(),
            description: None,
            subject: "math".to_string(),
            category: None,
            level: 0,
            estimated_minutes: None,
            objectives: None,
            viz_refs: None,
        }
    }

    #[test]
    fn test_migrations_idempotent() {
        let db1 = Db::open_in_memory().unwrap();
        let db2 = Db::open_in_memory().unwrap();

        let v1: u32 = db1
            .conn
            .query_row(
                "SELECT MAX(version) FROM schema_migrations",
                [],
                |row| row.get(0),
            )
            .unwrap();
        let v2: u32 = db2
            .conn
            .query_row(
                "SELECT MAX(version) FROM schema_migrations",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(v1, v2);
        assert_eq!(v1, 3);
    }

    #[test]
    fn test_topic_crud() {
        let db = Db::open_in_memory().unwrap();
        let topic = make_topic("t-1", "test-topic");
        db.topics().insert(&topic).unwrap();

        let fetched = db.topics().get_by_id("t-1").unwrap();
        assert_eq!(fetched.slug, "test-topic");

        db.topics().delete("t-1").unwrap();
        assert!(matches!(
            db.topics().get_by_id("t-1"),
            Err(Error::NotFound)
        ));
    }

    #[test]
    fn test_prerequisites_acyclic_detection() {
        let db = Db::open_in_memory().unwrap();
        db.topics().insert(&make_topic("a", "a")).unwrap();
        db.topics().insert(&make_topic("b", "b")).unwrap();
        // a → b → a would be a cycle
        db.topics().add_prerequisite("a", "b").unwrap();
        db.topics().add_prerequisite("b", "a").unwrap();
        assert!(has_cycle(&db.conn));
    }

    #[test]
    fn test_notes_uuid_ids() {
        let db = Db::open_in_memory().unwrap();
        let note = NewNote {
            topic_id: None,
            title: "UUID test".to_string(),
            body: "body".to_string(),
            tags: None,
        };
        let id = db.notes().insert(&note).unwrap();

        // Must be UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        let parts: Vec<&str> = id.split('-').collect();
        assert_eq!(parts.len(), 5, "UUID must have 5 dash-separated parts");
        assert_eq!(parts[0].len(), 8);
        assert_eq!(parts[1].len(), 4);
        assert_eq!(parts[2].len(), 4);
        assert_eq!(parts[3].len(), 4);
        assert_eq!(parts[4].len(), 12);
        assert!(parts[2].starts_with('4'), "version nibble must be 4");
        assert!(
            matches!(parts[3].chars().next(), Some('8' | '9' | 'a' | 'b')),
            "variant nibble must be 8, 9, a, or b"
        );

        // Round-trip: fetch by string id
        let fetched = db.notes().get(&id).unwrap();
        assert_eq!(fetched.id, id);
        assert_eq!(fetched.title, "UUID test");

        // Two inserts produce distinct IDs
        let note2 = NewNote {
            topic_id: None,
            title: "second".to_string(),
            body: "body2".to_string(),
            tags: None,
        };
        let id2 = db.notes().insert(&note2).unwrap();
        assert_ne!(id, id2, "each insert must produce a unique UUID");
    }

    #[test]
    fn test_notes_fts_search() {
        let db = Db::open_in_memory().unwrap();
        let n1 = NewNote {
            topic_id: None,
            title: "Integration by Parts".to_string(),
            body: "A technique for integrating products of functions.".to_string(),
            tags: None,
        };
        let n2 = NewNote {
            topic_id: None,
            title: "Newton's Laws".to_string(),
            body: "Force equals mass times acceleration.".to_string(),
            tags: None,
        };
        db.notes().insert(&n1).unwrap();
        db.notes().insert(&n2).unwrap();

        let results = db.notes().search("integrating").unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].title, "Integration by Parts");
    }

    #[test]
    fn test_mastery_upsert() {
        let db = Db::open_in_memory().unwrap();
        db.topics().insert(&make_topic("m-1", "mastery-topic")).unwrap();

        let m1 = NewMastery {
            topic_id: "m-1".to_string(),
            level: 0.3,
            confidence: 0.5,
            last_assessed_at: None,
        };
        db.mastery().upsert(&m1).unwrap();
        db.mastery().upsert(&m1).unwrap();

        // Should only have one row
        let count: i64 = db
            .conn
            .query_row("SELECT COUNT(*) FROM mastery WHERE topic_id = 'm-1'", [], |r| r.get(0))
            .unwrap();
        assert_eq!(count, 1);
    }

    #[test]
    fn test_review_schedule_due() {
        let db = Db::open_in_memory().unwrap();
        db.topics().insert(&make_topic("r-1", "review-topic")).unwrap();

        let sched = NewReviewSchedule {
            topic_id: "r-1".to_string(),
            due_at: "2020-01-01T00:00:00".to_string(),
            interval_days: 1.0,
            ease_factor: 2.5,
        };
        db.review_schedule().upsert(&sched).unwrap();

        let due = db.review_schedule().due_before("2030-01-01T00:00:00").unwrap();
        assert_eq!(due.len(), 1);
        assert_eq!(due[0].topic_id, "r-1");
    }

    #[test]
    fn test_backup_export_import() {
        let db = Db::open_in_memory().unwrap();
        db.topics().insert(&make_topic("bi-1", "backup-topic")).unwrap();

        let mastery = NewMastery {
            topic_id: "bi-1".to_string(),
            level: 0.7,
            confidence: 0.8,
            last_assessed_at: Some("2024-01-01T00:00:00".to_string()),
        };
        db.mastery().upsert(&mastery).unwrap();

        let bundle = export_json(&db).unwrap();

        // Clear mastery
        db.conn.execute("DELETE FROM mastery", []).unwrap();
        assert!(matches!(
            db.mastery().get_by_topic("bi-1"),
            Err(Error::NotFound)
        ));

        // Re-import
        let mut db2 = Db::open_in_memory().unwrap();
        db2.topics().insert(&make_topic("bi-1", "backup-topic")).unwrap();
        import_json(&mut db2, bundle).unwrap();

        let restored = db2.mastery().get_by_topic("bi-1").unwrap();
        assert!((restored.level - 0.7).abs() < 1e-9);
    }

    #[test]
    fn test_seed_no_cycles() {
        let db = Db::open_in_memory().unwrap();
        seed_all(&db).unwrap();
        assert!(!has_cycle(&db.conn), "seeded prerequisite graph contains a cycle");
    }

    #[test]
    fn test_problem_templates_seeded() {
        let db = Db::open_in_memory().unwrap();
        seed_all(&db).unwrap();

        // Every seeded topic across all subjects must have at least one problem template
        for subject in &["math", "physics", "engineering"] {
            let topics = db.topics().list_by_subject(subject).unwrap();
            assert!(!topics.is_empty(), "subject '{}' has no topics", subject);
            for topic in &topics {
                let templates = db.problem_templates().list_by_topic(&topic.id).unwrap();
                assert!(
                    !templates.is_empty(),
                    "topic '{}' (subject={}) has no problem templates",
                    topic.slug,
                    subject
                );
            }
        }

        // Spot-check a specific template exists and round-trips correctly
        let tpl = db
            .problem_templates()
            .get_by_id("calc-limits-pt-1")
            .unwrap();
        assert_eq!(tpl.topic_id, "calc-limits");
        assert_eq!(tpl.difficulty, 1);
        assert!(!tpl.prompt_template.is_empty());

        // Difficulty ordering is respected in list_by_topic
        let calc_templates = db.problem_templates().list_by_topic("calc-limits").unwrap();
        assert_eq!(calc_templates.len(), 3);
        assert!(calc_templates[0].difficulty <= calc_templates[1].difficulty);
        assert!(calc_templates[1].difficulty <= calc_templates[2].difficulty);
    }

    #[test]
    fn test_ensure_content_seeded_idempotent() {
        let db = Db::open_in_memory().unwrap();
        // First call seeds; second call is a no-op
        db.ensure_content_seeded().unwrap();
        db.ensure_content_seeded().unwrap();
        let count: i64 = db
            .conn
            .query_row("SELECT COUNT(*) FROM topics", [], |r| r.get(0))
            .unwrap();
        assert!(count > 0, "topics should be seeded after ensure_content_seeded");
    }
}
