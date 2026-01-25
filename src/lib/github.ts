export async function getGithubStars(repo: string): Promise<number | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        // Add token if available for higher rate limits
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        }),
      },
      next: {
        revalidate: 3600, // Cache for 1 hour
      },
    });

    if (!response.ok) {
      // Silently fail and use fallback - rate limiting is expected without token
      return null;
    }

    const data = await response.json();
    return data.stargazers_count ?? null;
  } catch {
    // Silently fail and use fallback
    return null;
  }
}
