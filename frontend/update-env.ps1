# PowerShell script to update .env.local with real Google OAuth credentials

Write-Host "🔐 Updating Google OAuth credentials in .env.local..." -ForegroundColor Green

# Define the replacement content
$oldContent = @'
# Google OAuth (to be configured)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# NextAuth Configuration
NEXTAUTH_SECRET=dummy-secret-for-development
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=dummy-google-client-id
GOOGLE_CLIENT_SECRET=dummy-google-client-secret
'@

$newContent = @'
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here

# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
'@

# Check if .env.local exists
if (Test-Path ".env.local") {
    # Read the current content
    $envContent = Get-Content ".env.local" -Raw

    # Replace the old content with new content
    $updatedContent = $envContent -replace [regex]::Escape($oldContent), $newContent

    # Write back to file
    $updatedContent | Set-Content ".env.local"

    Write-Host "✅ Successfully updated .env.local with Google OAuth credentials!" -ForegroundColor Green
    Write-Host "🔄 Please restart your development server (npm run dev)" -ForegroundColor Yellow
} else {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
    Write-Host "Please ensure you're in the correct directory and .env.local exists." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Restart your development server"
Write-Host "2. Test Google OAuth integration"
Write-Host "3. Implement authentication pages"
