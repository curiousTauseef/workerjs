var expect = require('expect.js'),
    path = require('path'),
    Worker = require('..');

function fixturePath(file) {
  return path.join(__dirname, 'fixtures', file);
}

describe('workerjs', function() {
  describe('require worker', function() {
    it('should be able to do simple web workers', function(done) {
      var worker = new Worker(fixturePath('evalworker.js'), true);
      worker.onmessage = function (msg) {
        expect(msg).to.eql({ data: { msg: 'hello', y: 84,
          received: 'another message' } });
        done();
      };
      worker.postMessage('another message');
    });

    it('should spawn in a different pid', function(done) {
      var pid = process.pid;
      var worker = new Worker(fixturePath('pidworker.js'), true);
      worker.onmessage = function (msg) {
        expect(msg.data).to.not.equal(pid);
        done();
      };
    });

    it('should be able to offload CPU intensive activity', function(done) {
      var start = Date.now();
      var worker = new Worker(fixturePath('fibworker.js'), true);
      worker.onmessage = function (msg) {
        expect(msg.data).to.equal(1346269);
        done();
      };
      worker.postMessage(30);
      expect(Date.now() - start).to.be.below(20);
    });

    it('should be able to use addEventListener', function(done) {
      var worker = new Worker(fixturePath('addEventListenerWorker.js'), true);
      worker.addEventListener('message', function (msg) {
        expect(msg).to.eql({ data: { msg: 'hello', y: 84,
          received: 'another message' } });
        done();
      });
      worker.postMessage('another message');
    });

    it('should be able to require other modules', function(done) {
      var worker = new Worker(fixturePath('requireworker.js'), true);
      worker.addEventListener('message', function (msg) {
        expect(msg.data).to.equal(15);
        done();
      });
      worker.postMessage(15);
    });

    it('should be able to pass different value types', function(done) {
      var worker = new Worker(fixturePath('requireworker.js'), true);
      var obj = {
        'number' : 42,
        'string' : "hello",
        'object' : {'a': 1},
        'array'  : [1,2,3],
        'typedArray' : new Uint8Array([1,2,3])
      };
      worker.addEventListener('message', function (msg) {
        expect(msg.data.number).to.equal(obj.number);
        expect(msg.data.string).to.equal(obj.string);
        expect(msg.data.object).to.eql(obj.object);
        expect(msg.data.array).to.eql(obj.array);
        expect(msg.data.typedArray).to.eql(obj.typedArray);
        done();
      });
      worker.postMessage(obj);
    });

    it('should run the module.exports function', function(done) {
      var worker = new Worker(fixturePath('exportsworker.js'), true);
      worker.addEventListener('message', function (msg) {
        expect(msg.data).to.equal(42);
        done();
      });
    });
  });
});
