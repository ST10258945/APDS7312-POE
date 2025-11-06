// Windsurf configuration file
module.exports = {
  // Project name (optional, defaults to package.json name)
  name: 'globewire',
  
  // Project description (optional)
  description: 'GlobeWire Application',
  
  // Default branch (optional, defaults to 'main')
  defaultBranch: 'main',
  
  // Workflows directory (relative to project root)
  workflowsDir: '.windsurf/workflows',
  
  // Node.js version to use (optional)
  nodeVersion: '20',
  
  // Environment variables (optional)
  env: {
    NODE_ENV: 'development',
  },
  
  // Workspace settings (optional)
  workspace: {
    // Additional paths to include in the workspace
    includes: [
      'app/**/*',
      'lib/**/*',
      'prisma/**/*',
      'public/**/*',
      'test/**/*',
      '*.{js,jsx,ts,tsx,json,md}'
    ],
    
    // Paths to exclude from the workspace
    excludes: [
      'node_modules/**',
      '.next/**',
      'coverage/**',
      '*.log'
    ]
  }
};
