/* globals describe, it, before, after */
import assert from 'assert';
import {restartable} from '../../src/restart';
import {Observable, Subject} from 'rx';


describe('restartable', () => {
  it('handles write only drivers', (done) => {
    const testDriver = () => {};

    restartable(testDriver)(Observable.empty());

    done();
  });

  it('handles read only drivers', (done) => {
    const testDriver = () => Observable.empty();

    restartable(testDriver)();

    done();
  });

  describe('sources.log$', () => {
    it('is subscribable', (done) => {
      const testSubject = new Subject();
      const testDriver = () => testSubject;

      const driver = restartable(testDriver)();

      driver.log$.subscribe(log => {
        assert.deepEqual(log, []);
        done();
      });
    });

    it('emits updates', (done) => {
      const testSubject = new Subject();
      const testDriver = () => testSubject;

      const driver = restartable(testDriver)();

      driver.log$.take(1).subscribe(log => {
        assert.deepEqual(log, []);
      });

      driver.log$.skip(1).take(1).subscribe(log => {
        const loggedEvent = log[0];

        assert.deepEqual(loggedEvent.identifier, ':root');
        assert.deepEqual(loggedEvent.event, 'foo');
        done();
      });

      testSubject.onNext('foo');
    });

    it('shares the last value upon subscription', (done) => {
      const testSubject = new Subject();
      const testDriver = () => testSubject;

      const driver = restartable(testDriver)();

      testSubject.onNext('foo');
      testSubject.onNext('foo');

      driver.log$.subscribe(log => {
        assert.equal(log.length, 2);
        done();
      });
    });

    it('handles selector style drivers', (done) => {
      const testSubject = new Subject();
      const testDriver = () => {
        return {
          select: (foo) => testSubject
        };
      };

      const driver = restartable(testDriver)();

      driver.select('snaz');

      testSubject.onNext('foo');
      testSubject.onNext('foo');

      driver.log$.subscribe(log => {
        assert.equal(log[0].identifier, 'snaz');
        assert.equal(log[0].event, 'foo');

        assert.equal(log.length, 2);

        done();
      });
    });
  });
});
