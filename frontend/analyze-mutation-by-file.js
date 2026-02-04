import fs from 'fs';

try {
  const html = fs.readFileSync('reports/mutation/mutation.html', 'utf8');
  
  // Extract the JSON data from the HTML
  const match = html.match(/app\.report\s*=\s*({[\s\S]*?});/);
  
  if (!match) {
    console.log('Could not find mutation report data in HTML');
    process.exit(1);
  }
  
  const data = JSON.parse(match[1]);
  
  // Calculate metrics for each file
  const fileStats = [];
  
  if (data.files) {
    Object.entries(data.files).forEach(([filePath, file]) => {
      const mutants = file.mutants || [];
      const metrics = {
        filePath,
        killed: 0,
        survived: 0,
        timeout: 0,
        noCoverage: 0,
        runtimeError: 0,
        compileError: 0,
        ignored: 0,
        total: 0
      };
      
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
      
      const validMutants = metrics.killed + metrics.survived;
      metrics.mutationScore = validMutants > 0 ? (metrics.killed / validMutants * 100) : 0;
      metrics.uncoveredMutants = metrics.survived + metrics.timeout + metrics.noCoverage;
      
      fileStats.push(metrics);
    });
  }
  
  // Sort by survived mutants (descending), then by total unkilled
  fileStats.sort((a, b) => {
    if (b.survived !== a.survived) {
      return b.survived - a.survived;
    }
    return b.uncoveredMutants - a.uncoveredMutants;
  });
  
  console.log('=== Files Ranked by Unkilled Mutants (Survived + Timeout + No Coverage) ===\n');
  console.log('Top 20 files with most unkilled mutants:\n');
  console.log('File'.padEnd(60) + 'Survived'.padEnd(12) + 'Timeout'.padEnd(10) + 'NoCov'.padEnd(10) + 'Total Unkilled'.padEnd(15) + 'Score%'.padEnd(10) + 'Total');
  console.log('-'.repeat(120));
  
  fileStats.slice(0, 20).forEach((file, index) => {
    const fileName = file.filePath.length > 58 ? '...' + file.filePath.slice(-55) : file.filePath;
    const totalUnkilled = file.survived + file.timeout + file.noCoverage;
    console.log(
      fileName.padEnd(60) +
      file.survived.toString().padEnd(12) +
      file.timeout.toString().padEnd(10) +
      file.noCoverage.toString().padEnd(10) +
      totalUnkilled.toString().padEnd(15) +
      file.mutationScore.toFixed(1).padEnd(10) +
      file.total.toString()
    );
  });
  
  console.log('\n=== Summary Statistics ===');
  const totalSurvived = fileStats.reduce((sum, f) => sum + f.survived, 0);
  const totalTimeout = fileStats.reduce((sum, f) => sum + f.timeout, 0);
  const totalNoCoverage = fileStats.reduce((sum, f) => sum + f.noCoverage, 0);
  const totalKilled = fileStats.reduce((sum, f) => sum + f.killed, 0);
  
  console.log(`Total Survived: ${totalSurvived}`);
  console.log(`Total Timeout: ${totalTimeout}`);
  console.log(`Total No Coverage: ${totalNoCoverage}`);
  console.log(`Total Unkilled: ${totalSurvived + totalTimeout + totalNoCoverage}`);
  console.log(`Total Killed: ${totalKilled}`);
  console.log(`Overall Mutation Score: ${((totalKilled / (totalKilled + totalSurvived)) * 100).toFixed(2)}%`);
  
} catch (error) {
  console.error('Error analyzing results:', error.message);
  process.exit(1);
}
