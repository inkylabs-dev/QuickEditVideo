import { promises as fs } from 'fs';
import path from 'path';
const POSTS_DIR = path.resolve(process.cwd(), 'posts');
const OUTPUT_FILE = path.resolve(process.cwd(), 'src/constants/blogPosts.ts');

const INTERFACE = `export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  pubDate: string;
  author: string;
  tags: string[];
  readingTime: string;
  contentHtml: string;
}\n\n`;

const ESCAPE_CONTENT = (content) => content.replace(/`/g, '\\`');

function trimQuotes(value) {
  if (!value) return value;
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontMatter(source) {
  if (!source.startsWith('---')) {
    throw new Error('Post must start with frontmatter');
  }

  const rest = source.slice(3);
  const endIndex = rest.indexOf('---');
  if (endIndex === -1) {
    throw new Error('Frontmatter section not closed');
  }

  const fmText = rest.slice(0, endIndex).trim();
  const content = rest.slice(endIndex + 3).trim();
  const data = {};
  let currentKey = null;

  for (const rawLine of fmText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('-') && currentKey) {
      const listValue = trimQuotes(line.slice(1).trim());
      if (!Array.isArray(data[currentKey])) {
        data[currentKey] = [];
      }
      data[currentKey].push(listValue);
    } else {
      const [key, ...restParts] = line.split(':');
      currentKey = key.trim();
      const value = restParts.join(':').trim();
      if (value === '') {
        data[currentKey] = [];
      } else {
        data[currentKey] = trimQuotes(value);
      }
    }
  }

  return { data, content };
}

async function loadPosts() {
  const files = (await fs.readdir(POSTS_DIR)).filter((file) => file.endsWith('.md'));
  const posts = [];

  for (const file of files) {
    const slug = path.basename(file, '.md');
  const raw = await fs.readFile(path.join(POSTS_DIR, file), 'utf8');
  const { data, content } = parseFrontMatter(raw);

    if (!data.title || !data.pubDate) {
      throw new Error(`Post ${file} missing required frontmatter fields`);
    }

    posts.push({
      slug,
      title: data.title,
      description: data.description ?? '',
      pubDate: data.pubDate,
      author: data.author ?? 'QuickEditVideo Team',
      tags: data.tags ?? [],
      readingTime: data.readingTime ?? '',
      contentHtml: content.trim(),
    });
  }

  return posts.sort((a, b) => (a.pubDate < b.pubDate ? 1 : -1));
}

function serializePosts(posts) {
  const entries = posts
    .map(
      (post) => `  {
    slug: '${post.slug}',
    title: ${JSON.stringify(post.title)},
    description: ${JSON.stringify(post.description)},
    pubDate: '${post.pubDate}',
    author: ${JSON.stringify(post.author)},
    tags: ${JSON.stringify(post.tags)},
    readingTime: ${JSON.stringify(post.readingTime)},
    contentHtml: \`${ESCAPE_CONTENT(post.contentHtml)}\`
  }`,
    )
    .join(',\n');

  return `export const BLOG_POSTS: BlogPost[] = [
${entries}
];\n\nexport const getBlogPostBySlug = (slug: string): BlogPost | undefined =>
  BLOG_POSTS.find((post) => post.slug === slug);
\nexport const getAllBlogPostSlugs = (): string[] => BLOG_POSTS.map((post) => post.slug);\n`;
}

async function main() {
  const posts = await loadPosts();
  const fileContents = `${INTERFACE}${serializePosts(posts)}`;
  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, fileContents, 'utf8');
  console.log(`Generated blog post metadata for ${posts.length} posts.`);
}

main().catch((error) => {
  console.error('[generate-blog-posts]', error);
  process.exit(1);
});
