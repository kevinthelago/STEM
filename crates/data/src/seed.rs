use crate::db::Db;
use crate::error::Result;
use crate::models::topic::NewTopic;
use serde::Deserialize;
use serde_json;

#[derive(Debug, Deserialize)]
struct ContentTopic {
    id: String,
    slug: String,
    title: String,
    description: Option<String>,
    level: i64,
    estimated_minutes: Option<i64>,
    objectives: Option<Vec<String>>,
    viz_refs: Option<Vec<String>>,
    prerequisites: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct ContentPack {
    #[allow(dead_code)]
    pack: String,
    subject: String,
    category: Option<String>,
    topics: Vec<ContentTopic>,
}

static PACK_SOURCES: &[(&str, &str)] = &[
    (
        "calculus",
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../content/math/calculus.json"
        )),
    ),
    (
        "linear_algebra",
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../content/math/linear_algebra.json"
        )),
    ),
    (
        "statistics",
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../content/math/statistics.json"
        )),
    ),
    (
        "mechanics",
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../content/physics/mechanics.json"
        )),
    ),
    (
        "electromagnetism",
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../content/physics/electromagnetism.json"
        )),
    ),
    (
        "mechanical",
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../content/engineering/mechanical.json"
        )),
    ),
    (
        "electrical",
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../content/engineering/electrical.json"
        )),
    ),
];

fn insert_pack(db: &Db, pack: &ContentPack) -> Result<()> {
    let topics_repo = db.topics();
    for ct in &pack.topics {
        let objectives = ct
            .objectives
            .as_ref()
            .map(|v| serde_json::to_string(v))
            .transpose()?;
        let viz_refs = ct
            .viz_refs
            .as_ref()
            .map(|v| serde_json::to_string(v))
            .transpose()?;

        let new_topic = NewTopic {
            id: ct.id.clone(),
            slug: ct.slug.clone(),
            title: ct.title.clone(),
            description: ct.description.clone(),
            subject: pack.subject.clone(),
            category: pack.category.clone(),
            level: ct.level,
            estimated_minutes: ct.estimated_minutes,
            objectives,
            viz_refs,
        };
        topics_repo.insert_or_ignore(&new_topic)?;
    }
    // second pass: prerequisites (topics must exist first)
    for ct in &pack.topics {
        for prereq_id in &ct.prerequisites {
            // skip if prerequisite topic doesn't exist yet (cross-pack deps seeded separately)
            let _ = topics_repo.add_prerequisite(&ct.id, prereq_id);
        }
    }
    Ok(())
}

pub fn seed_pack(db: &Db, pack_name: &str) -> Result<()> {
    for (name, src) in PACK_SOURCES {
        if *name == pack_name {
            let pack: ContentPack = serde_json::from_str(src)?;
            return insert_pack(db, &pack);
        }
    }
    Ok(())
}

pub fn seed_all(db: &Db) -> Result<()> {
    // First pass: insert all topics (so cross-pack prerequisite refs resolve)
    let mut packs: Vec<ContentPack> = Vec::new();
    for (_name, src) in PACK_SOURCES {
        let pack: ContentPack = serde_json::from_str(src)?;
        let topics_repo = db.topics();
        for ct in &pack.topics {
            let objectives = ct
                .objectives
                .as_ref()
                .map(|v| serde_json::to_string(v))
                .transpose()?;
            let viz_refs = ct
                .viz_refs
                .as_ref()
                .map(|v| serde_json::to_string(v))
                .transpose()?;
            let new_topic = NewTopic {
                id: ct.id.clone(),
                slug: ct.slug.clone(),
                title: ct.title.clone(),
                description: ct.description.clone(),
                subject: pack.subject.clone(),
                category: pack.category.clone(),
                level: ct.level,
                estimated_minutes: ct.estimated_minutes,
                objectives,
                viz_refs,
            };
            topics_repo.insert_or_ignore(&new_topic)?;
        }
        packs.push(pack);
    }
    // Second pass: prerequisites
    let topics_repo = db.topics();
    for pack in &packs {
        for ct in &pack.topics {
            for prereq_id in &ct.prerequisites {
                let _ = topics_repo.add_prerequisite(&ct.id, prereq_id);
            }
        }
    }
    Ok(())
}
