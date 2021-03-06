module.exports = (co) => {
	function Proxy ($delegate) {
		const self = this;

		this.unbindedMethodCall = (call, proxy, isCache = false) => {
			const cache = {};

			const original = $delegate[call];

			if (isCache) {
				// we don't want to have multiple simultaneous calls to the same resource(call + arguments)
				// so basically if we have one pending we always wait for it to return instead of making a new one
				const originalCachingWrapper = (...args) => co(function *() {
					const key = call + '.' + args.join(':');
					console.log('calling original, cache key', key);

					if (!cache[key])
						cache[key] = original(...args);

					const promise = cache[key];
					try {
						return yield promise;
					} finally {
						delete cache[key];
					}
				});

				return (...args) => co(function *() {
					return yield co(proxy(originalCachingWrapper, args));
				});
			}

			return (...args) => co(function *() {
				return yield co(proxy(original, args));
			});
		};

		this.methodCall = (call, proxy, isCache = false) => {
			$delegate[call] = self.unbindedMethodCall(call, proxy, isCache);
		};

		this.unbindedMethodSyncCall = (call, proxy) => {
			const original = $delegate[call];

			return (...args) => function () {
				return proxy(original, args);
			};
		};

		this.methodSyncCall = (call, proxy) => {
			$delegate[call] = self.unbindedMethodCall(call, proxy);
		};
	}

	return Proxy;
};