#!/usr/bin/env node

/**
 * Environment Variables Verification Script
 * Checks if all required environment variables are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying GeoGuardian Environment Configuration...\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found!');
    console.log('Please create .env.local file with required environment variables.');
    process.exit(1);
}

// Read environment file
const envContent = fs.readFileSync(envPath, 'utf8');

// Required environment variables to check
const requiredVars = [
    {
        key: 'GOOGLE_CLIENT_ID',
        pattern: /GOOGLE_CLIENT_ID=728868528948-k05t535ig5en67tkncsefgg5s7qn1ood\.apps\.googleusercontent\.com/,
        description: 'Google OAuth Client ID'
    },
    {
        key: 'GOOGLE_CLIENT_SECRET',
        pattern: /GOOGLE_CLIENT_SECRET=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/,
        description: 'Google OAuth Client Secret'
    },
    {
        key: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
        pattern: /NEXT_PUBLIC_GOOGLE_CLIENT_ID=728868528948-k05t535ig5en67tkncsefgg5s7qn1ood\.apps\.googleusercontent\.com/,
        description: 'Public Google OAuth Client ID'
    },
    {
        key: 'NEXTAUTH_SECRET',
        pattern: /NEXTAUTH_SECRET=.+/,
        description: 'NextAuth Secret'
    },
    {
        key: 'NEXTAUTH_URL',
        pattern: /NEXTAUTH_URL=.+/,
        description: 'NextAuth URL'
    }
];

// Check each required variable
let allValid = true;

requiredVars.forEach(({ key, pattern, description }) => {
    if (pattern.test(envContent)) {
        console.log(`✅ ${description}: Configured`);
    } else {
        console.log(`❌ ${description}: Not found or incorrect`);
        allValid = false;
    }
});

console.log('\n' + '='.repeat(50));

// Additional checks
const supabaseChecks = [
    {
        pattern: /NEXT_PUBLIC_SUPABASE_URL=https:\/\/exhuqtrrklcichdteauv\.supabase\.co/,
        description: 'Supabase URL'
    },
    {
        pattern: /NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/,
        description: 'Supabase Anonymous Key'
    }
];

console.log('\n🔗 Additional Configuration:');
supabaseChecks.forEach(({ pattern, description }) => {
    if (pattern.test(envContent)) {
        console.log(`✅ ${description}: Configured`);
    } else {
        console.log(`⚠️  ${description}: Using default/demo values`);
    }
});

console.log('\n' + '='.repeat(50));

if (allValid) {
    console.log('🎉 All critical environment variables are properly configured!');
    console.log('🚀 Ready to implement Google OAuth authentication.');
} else {
    console.log('⚠️  Some environment variables need attention.');
    console.log('📝 Check UPDATE_ENV_INSTRUCTIONS.md for setup details.');
}

console.log('\n💡 Next Steps:');
console.log('1. Implement authentication pages (/auth/login, /auth/register)');
console.log('2. Set up NextAuth.js configuration');
console.log('3. Test Google OAuth integration');
console.log('4. Create protected routes and user dashboard');
