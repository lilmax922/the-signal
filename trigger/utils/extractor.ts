import { extractFromHtml } from '@extractus/article-extractor'
import { Agent, setGlobalDispatcher, fetch as undiciFetch } from 'undici'

setGlobalDispatcher(
  new Agent({
    maxHeaderSize: 32768,
  }),
)

const USER_AGENT
  = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

export async function extractArticleContent(url: string): Promise<string> {
  const response = await undiciFetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status} ${url}`)
  }

  const html = await response.text()
  const article = await extractFromHtml(html, url)
  const content = article?.content ?? ''

  return content.replace(/<[^>]*>/g, '').trim()
}
