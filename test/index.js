const { Harness, Suite, SpecReporter } = require('zunit');

const suite = new Suite('foxtan').discover();
const harness = new Harness(suite);

const interactive = String(process.env.CI).toLowerCase() !== 'true';
const reporter = new SpecReporter({ colours: interactive });

harness.run(reporter).then(report => {
  if (report.failed) {
    process.exit(1);
  }
  if (report.incomplete) {
    console.log(`One or more tests were not run!`);
    process.exit(2);
  }
  process.exit(0);
});
