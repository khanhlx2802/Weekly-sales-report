import { config } from "./config.js"

export function validateDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`Invalid date: ${value}. Expected YYYY-MM-DD.`)
  const parsed = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error(`Invalid calendar date: ${value}`)
  return value
}

export function addDays(dateOnly: string, days: number) {
  const date = new Date(`${validateDateOnly(dateOnly)}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function richText(value: any[] | undefined) {
  return (value ?? []).map((item) => item?.plain_text ?? item?.text?.content ?? "").join("")
}

function normalizeProperty(property: any): unknown {
  if (!property || typeof property !== "object") return property ?? null
  switch (property.type) {
    case "title": return richText(property.title)
    case "rich_text": return richText(property.rich_text)
    case "date": return property.date
    case "select": return property.select?.name ?? null
    case "multi_select": return (property.multi_select ?? []).map((item: any) => item.name)
    case "status": return property.status?.name ?? null
    case "people": return (property.people ?? []).map((person: any) => ({ id: person.id, name: person.name }))
    case "relation": return (property.relation ?? []).map((item: any) => item.id)
    case "checkbox": return Boolean(property.checkbox)
    case "number": return property.number ?? null
    case "url": return property.url ?? null
    case "email": return property.email ?? null
    case "phone_number": return property.phone_number ?? null
    case "formula": return property.formula?.[property.formula?.type] ?? property.formula ?? null
    case "rollup": return property.rollup ?? null
    case "files": return (property.files ?? []).map((file: any) => ({ name: file.name, url: file.external?.url ?? file.file?.url ?? null }))
    default: return property[property.type] ?? null
  }
}

function normalizePage(page: any) {
  const properties = Object.fromEntries(Object.entries(page.properties ?? {}).map(([name, value]) => [name, normalizeProperty(value)]))
  return { id: page.id, url: page.url, createdTime: page.created_time, lastEditedTime: page.last_edited_time, ...properties }
}

export async function readActivities(notion: any, startDate: string, endDate: string) {
  const start = validateDateOnly(startDate)
  const end = validateDateOnly(endDate)
  const useDataSources = Boolean(notion.dataSources?.query)
  const query = useDataSources ? notion.dataSources.query.bind(notion.dataSources) : notion.databases.query.bind(notion.databases)
  const results: any[] = []
  let cursor: string | undefined

  do {
    const response = await query({
      ...(useDataSources ? { data_source_id: config.activitiesDataSourceId } : { database_id: config.activitiesDataSourceId }),
      filter: { and: [
        { property: "Date", date: { on_or_after: start } },
        { property: "Date", date: { on_or_before: end } },
      ] },
      sorts: [{ property: "Date", direction: "ascending" }],
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    })
    results.push(...response.results)
    cursor = response.has_more ? response.next_cursor ?? undefined : undefined
  } while (cursor)

  return results.map(normalizePage)
}

export async function createReportPage(notion: any, title: string, markdown: string) {
  return notion.pages.create({
    parent: { page_id: config.reportParentPageId },
    properties: { title: { title: [{ text: { content: title } }] } },
    markdown,
  })
}
