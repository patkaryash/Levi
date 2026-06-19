// Standalone test script for GitHub API integration
// This bypasses the Paperclip event system and tests the GitHub API directly

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "YOUR_TOKEN_HERE";
const GITHUB_OWNER = process.env.GITHUB_OWNER || "test-owner";
const GITHUB_REPO = process.env.GITHUB_REPO || "test-repo";

async function createGitHubIssue(title, body) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`;
  
  console.log("Making request to:", url);
  console.log("Title:", title);
  console.log("Body:", body);
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, body }),
  });
  
  console.log("Response status:", response.status, response.statusText);
  
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${errorBody}`);
  }
  
  const data = await response.json();
  return data;
}

async function main() {
  try {
    console.log("=== GitHub API Test ===");
    console.log("Owner:", GITHUB_OWNER);
    console.log("Repo:", GITHUB_REPO);
    console.log("Token present:", GITHUB_TOKEN ? "Yes" : "No");
    
    const issue = await createGitHubIssue(
      "Paperclip GitHub Integration Test",
      "Created by manual plugin validation"
    );
    
    console.log("\n=== Success ===");
    console.log("Issue number:", issue.number);
    console.log("Issue URL:", issue.html_url);
    console.log("Issue ID:", issue.id);
    console.log("Title:", issue.title);
  } catch (error) {
    console.error("\n=== Error ===");
    console.error(error.message);
    process.exit(1);
  }
}

main();
