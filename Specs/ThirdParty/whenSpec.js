/*global defineSuite */
defineSuite([
        'ThirdParty/when'
    ], function(
        when) {
    "use strict";
    /*global jasmine,describe,xdescribe,it,xit,expect,beforeEach,afterEach,beforeAll,afterAll,spyOn,runs,waits,waitsFor*/

    // These tests are from my original attempt to write my own promise implementation.
    // When I switched to cujojs/when, I figured I may as well leave these here since
    // they all still work.  - SKH

    var capturedValue;
    var capturedError;
    var promise;
    var resolver;

    function captureValue(value) {
        capturedValue = value;
    }

    function captureError(error) {
        capturedError = error;
    }

    beforeEach(function() {
        var deferred = when.defer();
        promise = deferred.promise;
        resolver = deferred.resolver;
        capturedValue = undefined;
        capturedError = undefined;
    });

    it('does not call callbacks immediately', function() {
        promise.then(captureValue, captureError);

        expect(capturedValue).toBeUndefined();
        expect(capturedError).toBeUndefined();
    });

    it('calls success when resolved before then is called', function() {
        var value = 1;

        resolver.resolve(value);

        promise.then(captureValue, captureError);

        expect(capturedValue).toEqual(value);
        expect(capturedError).toBeUndefined();
    });

    it('calls success when resolved after then is called', function() {
        var value = 1;

        promise.then(captureValue, captureError);

        resolver.resolve(value);

        expect(capturedValue).toEqual(value);
        expect(capturedError).toBeUndefined();
    });

    it('calls success when failure is omitted', function() {
        var value = 1;

        promise.then(captureValue);

        resolver.resolve(value);

        expect(capturedValue).toEqual(value);
        expect(capturedError).toBeUndefined();
    });

    it('calls failure when rejected before then is called', function() {
        var error = 'error';

        resolver.reject(error);

        promise.then(captureValue, captureError);

        expect(capturedValue).toBeUndefined();
        expect(capturedError).toEqual(error);
    });

    it('calls failure when rejected after then is called', function() {
        var error = 'error';

        promise.then(captureValue, captureError);

        resolver.reject(error);

        expect(capturedValue).toBeUndefined();
        expect(capturedError).toEqual(error);
    });

    it('calls failure when success is omitted', function() {
        var error = 'error';

        promise.then(undefined, captureError);

        resolver.reject(error);

        expect(capturedValue).toBeUndefined();
        expect(capturedError).toEqual(error);
    });

    it('chains success', function() {
        promise.then(function(val) {
            return val + 1;
        }).then(captureValue);

        resolver.resolve(1);
        expect(capturedValue).toEqual(2);
    });

    it('chains failure', function() {
        promise.then(undefined, function(e) {
            return when.reject('important' + e);
        }).then(captureValue, captureError);

        resolver.reject('error');
        expect(capturedError).toEqual('importanterror');
    });

    // previous versions of when.js would throw when resolving or rejecting multiple times.
    it('ignores when resolving or rejecting after resolving', function() {
        resolver.resolve(1);
        resolver.resolve(5);
        resolver.reject('e');
    });

    it('ignores when resolving or rejecting after rejecting', function() {
        resolver.reject('2');
        resolver.resolve(5);
        resolver.reject('e');
    });

    it('can handle resolving to another promise that resolves', function() {
        var resolveNext;
        var promiseResolved = false;

        promise.then(function(value) {
            promiseResolved = true;

            var next = when.defer();
            resolveNext = function(v) {
                next.resolve(v);
            };
            return next.promise;
        }).then(captureValue);

        resolver.resolve(5);

        expect(promiseResolved).toEqual(true);
        expect(capturedValue).toBeUndefined();

        resolveNext(6);

        expect(capturedValue).toEqual(6);
    });

    it('can handle resolving to another promise that rejects', function() {
        var rejectNext;
        var promiseResolved = false;

        promise.then(function(value) {
            promiseResolved = true;

            var next = when.defer();
            rejectNext = function(e) {
                next.reject(e);
            };
            return next.promise;
        }).then(captureValue, captureError);

        resolver.resolve(5);

        expect(promiseResolved).toEqual(true);
        expect(capturedValue).toBeUndefined();

        rejectNext('error');

        expect(capturedValue).toBeUndefined();
        expect(capturedError).toEqual('error');
    });

    it('can handle rejecting to another promise that resolves', function() {
        var resolveNext;
        var promiseResolved = false;
        var promiseRejected = false;

        promise.then(function(value) {
            promiseResolved = true;
        }, function(error) {
            promiseRejected = true;
            var next = when.defer();
            resolveNext = function(v) {
                next.resolve(v);
            };
            return next.promise;
        }).then(captureValue, captureError);

        resolver.reject('e');

        expect(promiseResolved).toEqual(false);
        expect(promiseRejected).toEqual(true);
        expect(capturedValue).toBeUndefined();

        resolveNext(6);

        expect(capturedValue).toEqual(6);
        expect(capturedError).toBeUndefined();
    });

    it('can handle rejecting to another promise that rejects', function() {
        var rejectNext;
        var promiseResolved = false;
        var promiseRejected = false;

        promise.then(function(value) {
            promiseResolved = true;
        }, function(error) {
            promiseRejected = true;
            var next = when.defer();
            rejectNext = function(e) {
                next.reject(e);
            };
            return next.promise;
        }).then(captureValue, captureError);

        resolver.reject('e');

        expect(promiseResolved).toEqual(false);
        expect(promiseRejected).toEqual(true);
        expect(capturedValue).toBeUndefined();

        rejectNext('error');

        expect(capturedValue).toBeUndefined();
        expect(capturedError).toEqual('error');
    });

    it('can pass through resolving', function() {
        promise.then(undefined, function(error) {
            return 'error';
        }).then(captureValue, captureError);

        resolver.resolve(5);

        expect(capturedValue).toEqual(5);
        expect(capturedError).toBeUndefined();
    });

    it('can pass through rejecting', function() {
        promise.then(function(value) {
            return value + 5;
        }).then(captureValue, captureError);

        resolver.reject('error');

        expect(capturedValue).toBeUndefined();
        expect(capturedError).toEqual('error');
    });

    describe('when', function() {
        it('works with values', function() {
            var value = 1;

            when(value, captureValue, captureError);

            expect(capturedValue).toEqual(value);
            expect(capturedError).toBeUndefined();
        });

        it('works with promises that resolve', function() {
            var value = 1;

            when(promise, captureValue, captureError);

            resolver.resolve(value);

            expect(capturedValue).toEqual(value);
            expect(capturedError).toBeUndefined();
        });

        it('works with deferreds that reject', function() {
            var error = 'error';

            when(promise, captureValue, captureError);

            resolver.reject(error);

            expect(capturedValue).toBeUndefined();
            expect(capturedError).toEqual(error);
        });
    });
});