// Direct GitHub API test - bypasses Paperclip entirely
// Usage: node test-github-direct.js <token> <owner> <repo>

const [,, token, owner, repo] = process.argv;

if (!token || !owner || !repo) {
  console.log("Usage: node test-github-direct.js <token> <owner> <repo>");
  console.log("Example: node test-github-direct.js ghp_xxx myuser myrepo");
  process.exit(1);
}

async function testGitHubAPI() {
  console.log("=== GitHub API Direct Test ===");
  console.log("Owner:", owner);
  console.log("Repo:", repo);
  console.log("Token present:", token ? "Yes (" + token.substring(0, 8) + "...)" : "No");
  
  const url = `https://api.github.com/repos/${owner}/${repo}/issues`;
  
  console.log("\nRequest URL:", url);
  console.log("Method: POST");
  console.log("Title: Paperclip GitHub Integration Test");
  console.log("Body: Created by manual plugin validation");
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        "User-Agent": "Paperclip-GitHub-Integration-Test"
      },
      body: JSON.stringify({
        title: "Paperclip GitHub Integration Test",
        body: "Created by manual plugin validation"
      })
    });
    
    console.log("\n=== Response ===");
    console.log("Status:", response.status, response.statusText);
    console.log("Headers:", Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    
    if (response.ok) {
      console.log("\n=== SUCCESS ===");
      console.log("Issue number:", data.number);
      console.log("Issue URL:", data.html_url);
      console.log("Issue ID:", data.id);
      console.log("Title:", data.title);
      console.log("State:", data.state);
      console.log("Created at:", data.created_at);
    } else {
      console.log("\n=== ERROR ===");
      console.log("Message:", data.message);
      console.log("Documentation URL:", data.documentation_url);
      if (data.errors) {
        console.log("Errors:", JSON.stringify(data.errors, null, 2));
      }
    }
  } catch (error) {
    console.error("\n=== NETWORK ERROR ===");
    console.error(error.message);
  }
}

testGitHubAPI();
