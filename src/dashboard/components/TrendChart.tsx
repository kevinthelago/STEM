import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { accent, surface, text, font } from '@/theme'
import type { MasteryRecord } from '../api'
import { computeMasteryScore, DEFAULT_WEIGHTS } from '../masteryModel'

interface TrendChartProps {
  records: MasteryRecord[]
  topicName: string
  width?: number
  height?: number
}

interface DataPoint {
  date: Date
  score: number
}

function buildTimeSeries(records: MasteryRecord[]): DataPoint[] {
  if (records.length === 0) return []

  const sorted = [...records].sort(
    (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
  )

  const dates = [...new Set(sorted.map((r) => r.updated_at.slice(0, 10)))].sort()

  return dates.map((dateStr) => {
    const snapshotDate = new Date(dateStr + 'T23:59:59Z')
    const snapshotRecords = sorted.filter(
      (r) => new Date(r.updated_at) <= snapshotDate
    )
    const deduped = Object.values(
      snapshotRecords.reduce<Record<string, MasteryRecord>>((acc, r) => {
        acc[r.signal] = r
        return acc
      }, {})
    )
    return {
      date: new Date(dateStr),
      score: computeMasteryScore(deduped, DEFAULT_WEIGHTS, snapshotDate),
    }
  })
}

export function TrendChart({ records, topicName, width = 500, height = 200 }: TrendChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const data = buildTimeSeries(records)
    const margin = { top: 16, right: 16, bottom: 32, left: 40 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .attr('style', `background:transparent`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    if (data.length === 0) {
      g.append('text')
        .attr('x', innerW / 2)
        .attr('y', innerH / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', text.placeholder)
        .attr('font-size', 13)
        .attr('font-family', font.ui)
        .text('No trend data yet')
      return
    }

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date) as [Date, Date])
      .range([0, innerW])

    const y = d3.scaleLinear().domain([0, 100]).range([innerH, 0])

    const area = d3
      .area<DataPoint>()
      .x((d) => x(d.date))
      .y0(innerH)
      .y1((d) => y(d.score))
      .curve(d3.curveMonotoneX)

    const line = d3
      .line<DataPoint>()
      .x((d) => x(d.date))
      .y((d) => y(d.score))
      .curve(d3.curveMonotoneX)

    const gradId = `areaGrad-${topicName.replace(/\s/g, '')}`
    g.append('defs')
      .append('linearGradient')
      .attr('id', gradId)
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', innerH)
      .selectAll('stop')
      .data([
        { offset: '0%', color: accent.primary, opacity: 0.28 },
        { offset: '100%', color: accent.primary, opacity: 0 },
      ])
      .join('stop')
      .attr('offset', (d) => d.offset)
      .attr('stop-color', (d) => d.color)
      .attr('stop-opacity', (d) => d.opacity)

    // Grid lines
    g.append('g')
      .selectAll('line.grid')
      .data(y.ticks(5))
      .join('line')
      .attr('class', 'grid')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d))
      .attr('stroke', surface.track)
      .attr('stroke-width', 1)

    g.append('path')
      .datum(data)
      .attr('fill', `url(#${gradId})`)
      .attr('d', area)

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', accent.primary)
      .attr('stroke-width', 2)
      .attr('d', line)

    // Dots
    g.selectAll('circle.dot')
      .data(data)
      .join('circle')
      .attr('class', 'dot')
      .attr('cx', (d) => x(d.date))
      .attr('cy', (d) => y(d.score))
      .attr('r', 3)
      .attr('fill', accent.text)

    const axisColor = text.placeholder

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(
        d3.axisBottom(x)
          .ticks(5)
          .tickFormat(d3.timeFormat('%b %d') as (d: Date | d3.NumberValue) => string)
      )
      .call((ax) => {
        ax.select('.domain').remove()
        ax.selectAll('.tick line').attr('stroke', surface.track)
        ax.selectAll('.tick text')
          .attr('fill', axisColor)
          .attr('font-size', 11)
          .attr('font-family', font.mono)
      })

    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat((d) => String(d)))
      .call((ax) => {
        ax.select('.domain').remove()
        ax.selectAll('.tick line').attr('stroke', surface.track)
        ax.selectAll('.tick text')
          .attr('fill', axisColor)
          .attr('font-size', 11)
          .attr('font-family', font.mono)
      })
  }, [records, topicName, width, height])

  return <svg ref={svgRef} />
}
