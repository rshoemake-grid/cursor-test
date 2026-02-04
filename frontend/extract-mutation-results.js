const fs = require('fs');

try {
  const html = fs.readFileSync('reports/mutation/mutation.html', 'utf8');
  
  // Extract the JSON data from the HTML
  const match = html.match(/app\.report\s*=\s*({[\s\S]*?});/);
  
  if (!match) {
    console.log('Could not find mutation report data in HTML');
    process.exit(1);
  }
  
  const data = JSON.parse(match[1]);
  
  // Calculate overall metrics
  const metrics = {
    killed: 0,
    survived: 0,
    timeout: 0,
    noCoverage: 0,
    runtimeError: 0,
    compileError: 0,
    ignored: 0,
    total: 0
  };
  
  if (data.files) {
    Object.values(data.files).forEach(file => {
      const mutants = file.mutants || [];
      mutants.forEach(mutant => {
        metrics.total++;
        switch(mutant.status) {
          case 'Killed':
            metrics.killed++;
            break;
          case 'Survived':
            metrics.survived++;
            break;
          case 'Timeout':
            metrics.timeout++;
            break;
          case 'NoCoverage':
            metrics.noCoverage++;
            break;
          case 'RuntimeError':
            metrics.runtimeError++;
            break;
          case 'CompileError':
            metrics.compileError++;
            break;
          case 'Ignored':
            metrics.ignored++;
            break;
        }
      });
    });
  }
  
  const validMutants = metrics.killed + metrics.survived;
  const mutationScore = validMutants > 0 ? (metrics.killed / validMutants * 100).toFixed(2) : '0.00';
  const coveredMutants = metrics.killed + metrics.survived + metrics.timeout;
  const coveredScore = coveredMutants > 0 ? (metrics.killed / coveredMutants * 100).toFixed(2) : '0.00';
  
  console.log('=== Mutation Test Results ===');
  console.log('');
  console.log('Overall Results:');
  console.log(`  Mutation Score: ${mutationScore}%`);
  console.log(`  Covered Score: ${coveredScore}%`);
  console.log('');
  console.log('Mutant Statistics:');
  console.log(`  Killed: ${metrics.killed}`);
  console.log(`  Survived: ${metrics.survived}`);
  console.log(`  Timeout: ${metrics.timeout}`);
  console.log(`  No Coverage: ${metrics.noCoverage}`);
  console.log(`  Runtime Error: ${metrics.runtimeError}`);
  console.log(`  Compile Error: ${metrics.compileError}`);
  console.log(`  Ignored: ${metrics.ignored}`);
  console.log(`  Total Mutants: ${metrics.total}`);
  console.log('');
  
  // Get useMarketplaceData.ts specific results
  const useMarketplaceData = data.files && data.files['src/hooks/useMarketplaceData.ts'];
  if (useMarketplaceData) {
    const fileMetrics = {
      killed: 0,
      survived: 0,
      timeout: 0,
      noCoverage: 0,
      total: 0
    };
    
    (useMarketplaceData.mutants || []).forEach(mutant => {
      fileMetrics.total++;
      switch(mutant.status) {
        case 'Killed':
          fileMetrics.killed++;
          break;
        case 'Survived':
          fileMetrics.survived++;
          break;
        case 'Timeout':
          fileMetrics.timeout++;
          break;
        case 'NoCoverage':
          fileMetrics.noCoverage++;
          break;
      }
    });
    
    const fileValid = fileMetrics.killed + fileMetrics.survived;
    const fileScore = fileValid > 0 ? (fileMetrics.killed / fileValid * 100).toFixed(2) : '0.00';
    
    console.log('useMarketplaceData.ts Results:');
    console.log(`  Mutation Score: ${fileScore}%`);
    console.log(`  Killed: ${fileMetrics.killed}`);
    console.log(`  Survived: ${fileMetrics.survived}`);
    console.log(`  Timeout: ${fileMetrics.timeout}`);
    console.log(`  No Coverage: ${fileMetrics.noCoverage}`);
    console.log(`  Total Mutants: ${fileMetrics.total}`);
  }
  
} catch (error) {
  console.error('Error extracting results:', error.message);
  process.exit(1);
}
