// Performance Testing Script for ScholarTrack
// Run this in browser console to test performance metrics

class PerformanceTester {
  constructor() {
    this.results = [];
    this.startTime = performance.now();
  }

  // Test page load performance
  async testPageLoadPerformance() {
    console.log('🚀 Testing Page Load Performance...');
    
    // Navigation Timing API
    const navigation = performance.getEntriesByType('navigation')[0];
    
    const metrics = {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      fullLoad: navigation.loadEventEnd - navigation.loadEventStart,
      domInteractive: navigation.domInteractive - navigation.navigationStart,
      firstPaint: 0,
      largestContentfulPaint: 0,
    };

    // Paint Timing API
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    
    if (firstPaint) metrics.firstPaint = firstPaint.startTime;
    if (firstContentfulPaint) metrics.firstContentfulPaint = firstContentfulPaint.startTime;

    // Largest Contentful Paint
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      metrics.largestContentfulPaint = lastEntry.startTime;
    });
    observer.observe({ entryTypes: ['largest-contentful-paint'] });

    console.table(metrics);
    
    // Performance scoring
    const scores = {
      domInteractive: metrics.domInteractive < 1000 ? 'GOOD' : metrics.domInteractive < 2000 ? 'OKAY' : 'POOR',
      firstPaint: metrics.firstPaint < 500 ? 'GOOD' : metrics.firstPaint < 1000 ? 'OKAY' : 'POOR',
      fullLoad: metrics.fullLoad < 1500 ? 'GOOD' : metrics.fullLoad < 3000 ? 'OKAY' : 'POOR',
    };

    console.log('📊 Performance Scores:', scores);
    return { metrics, scores };
  }

  // Test navigation speed between pages
  async testNavigationSpeed() {
    console.log('🧭 Testing Navigation Speed...');
    
    const routes = [
      '/dashboard',
      '/subjects', 
      '/students',
      '/classes',
      '/reports',
      '/announcements'
    ];

    const navTimes = [];

    for (const route of routes) {
      const startTime = performance.now();
      
      // Simulate navigation (you'll need to manually navigate for real test)
      console.log(`Navigate to ${route} and press Enter...`);
      await this.waitForUserInput();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      navTimes.push({ route, duration });
      console.log(`${route}: ${duration.toFixed(2)}ms`);
    }

    const avgNavTime = navTimes.reduce((sum, nav) => sum + nav.duration, 0) / navTimes.length;
    console.log(`Average navigation time: ${avgNavTime.toFixed(2)}ms`);
    
    return navTimes;
  }

  // Test form performance (especially large forms)
  async testFormPerformance() {
    console.log('📝 Testing Form Performance...');
    
    // Test CSV import with large file
    console.log('Test 1: Large CSV Import');
    console.log('1. Create a CSV with 100+ students');
    console.log('2. Import and measure time');
    
    // Test gradebook with many students
    console.log('Test 2: Gradebook with Many Students');
    console.log('1. Create class with 30+ students');
    console.log('2. Open gradebook and measure render time');
    
    return { message: 'Manual testing required' };
  }

  // Test memory usage
  testMemoryUsage() {
    console.log('🧠 Testing Memory Usage...');
    
    if (performance.memory) {
      const memory = {
        usedJSHeapSize: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
        totalJSHeapSize: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
        jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + ' MB',
      };
      
      console.table(memory);
      
      // Memory health check
      const usedMB = performance.memory.usedJSHeapSize / 1024 / 1024;
      const health = usedMB < 50 ? 'GOOD' : usedMB < 100 ? 'OKAY' : 'HIGH';
      
      console.log(`Memory health: ${health}`);
      return { memory, health };
    } else {
      console.log('Memory API not available in this browser');
      return null;
    }
  }

  // Test resource loading
  testResourcePerformance() {
    console.log('📦 Testing Resource Performance...');
    
    const resources = performance.getEntriesByType('resource');
    
    const resourceStats = {
      scripts: resources.filter(r => r.name.includes('.js')),
      styles: resources.filter(r => r.name.includes('.css')),
      images: resources.filter(r => r.name.match(/\.(jpg|jpeg|png|gif|svg)$/)),
      total: resources.length
    };

    console.log(`Total resources: ${resourceStats.total}`);
    console.log(`Scripts: ${resourceStats.scripts.length}`);
    console.log(`Stylesheets: ${resourceStats.styles.length}`);
    console.log(`Images: ${resourceStats.images.length}`);

    // Find slow resources
    const slowResources = resources
      .filter(r => r.duration > 1000)
      .sort((a, b) => b.duration - a.duration);

    if (slowResources.length > 0) {
      console.log('⚠️ Slow loading resources:');
      slowResources.forEach(r => {
        console.log(`${r.name}: ${r.duration.toFixed(2)}ms`);
      });
    } else {
      console.log('✅ All resources loaded quickly');
    }

    return resourceStats;
  }

  // Test API response times
  async testAPIPerformance() {
    console.log('🔌 Testing API Performance...');
    
    const apiTests = [
      { name: 'Get Subjects', url: '/api/subjects' },
      { name: 'Get Students', url: '/api/students' },
      { name: 'Get Classes', url: '/api/classes' },
    ];

    const results = [];

    for (const test of apiTests) {
      const startTime = performance.now();
      
      try {
        const response = await fetch(test.url, { credentials: 'include' });
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        results.push({
          name: test.name,
          duration: duration.toFixed(2) + 'ms',
          status: response.ok ? 'SUCCESS' : 'ERROR',
          size: response.headers.get('content-length') || 'unknown'
        });
        
      } catch (error) {
        results.push({
          name: test.name,
          duration: 'FAILED',
          status: 'ERROR',
          error: error.message
        });
      }
    }

    console.table(results);
    return results;
  }

  // Helper method for user input
  waitForUserInput() {
    return new Promise(resolve => {
      const handler = (e) => {
        if (e.key === 'Enter') {
          document.removeEventListener('keydown', handler);
          resolve();
        }
      };
      document.addEventListener('keydown', handler);
    });
  }

  // Run all performance tests
  async runAllTests() {
    console.log('🎯 Starting Performance Test Suite...\n');
    
    const results = {
      pageLoad: await this.testPageLoadPerformance(),
      memory: this.testMemoryUsage(),
      resources: this.testResourcePerformance(),
      api: await this.testAPIPerformance(),
    };

    console.log('\n📊 Performance Test Summary:');
    console.log('='.repeat(50));
    
    // Overall performance score
    let score = 0;
    let maxScore = 0;

    // Page load scoring
    if (results.pageLoad.scores.domInteractive === 'GOOD') score += 3;
    else if (results.pageLoad.scores.domInteractive === 'OKAY') score += 2;
    else score += 1;
    maxScore += 3;

    // Memory scoring
    if (results.memory && results.memory.health === 'GOOD') score += 2;
    else if (results.memory && results.memory.health === 'OKAY') score += 1;
    maxScore += 2;

    // API scoring
    const avgApiTime = results.api.reduce((sum, test) => {
      const time = parseFloat(test.duration);
      return sum + (isNaN(time) ? 1000 : time);
    }, 0) / results.api.length;

    if (avgApiTime < 200) score += 2;
    else if (avgApiTime < 500) score += 1;
    maxScore += 2;

    const percentage = (score / maxScore * 100).toFixed(1);
    
    console.log(`Overall Performance Score: ${score}/${maxScore} (${percentage}%)`);
    
    if (percentage >= 80) {
      console.log('🎉 Excellent performance!');
    } else if (percentage >= 60) {
      console.log('✅ Good performance');
    } else {
      console.log('⚠️ Performance needs improvement');
    }

    return results;
  }
}

// Lighthouse audit simulation
function runLighthouseChecks() {
  console.log('🏠 Running Lighthouse-style Checks...');
  
  const checks = {
    // Performance
    largeImages: document.querySelectorAll('img[src*="jpg"], img[src*="png"]').length,
    unoptimizedImages: document.querySelectorAll('img:not([loading="lazy"])').length,
    
    // Accessibility  
    missingAltText: document.querySelectorAll('img:not([alt])').length,
    unlabeledInputs: document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').length,
    
    // Best Practices
    httpLinks: document.querySelectorAll('a[href^="http:"]').length,
    targetsWithoutRel: document.querySelectorAll('a[target="_blank"]:not([rel*="noopener"])').length,
    
    // SEO
    missingMetaDescription: document.querySelector('meta[name="description"]') ? 0 : 1,
    missingTitle: document.title ? 0 : 1,
  };

  console.table(checks);
  
  const issues = Object.entries(checks).filter(([key, value]) => value > 0);
  
  if (issues.length === 0) {
    console.log('✅ No issues found!');
  } else {
    console.log('⚠️ Issues to address:');
    issues.forEach(([issue, count]) => {
      console.log(`- ${issue}: ${count}`);
    });
  }

  return checks;
}

// Auto-setup
console.log('📈 Performance Tester loaded!');
console.log('Run: new PerformanceTester().runAllTests()');
console.log('Or: runLighthouseChecks() for accessibility checks');

// Export for global use
window.PerformanceTester = PerformanceTester;
window.runLighthouseChecks = runLighthouseChecks;
