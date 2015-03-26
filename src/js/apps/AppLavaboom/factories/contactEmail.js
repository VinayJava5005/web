module.exports = /*@ngInject*/($rootScope, $translate, $timeout, $injector, co, consts, contacts) => {
	const translations = {
		LB_NEW : '',
		LB_PRIVATE : '',
		LB_BUSINESS : '',
		LB_HIDDEN : '',
		'MAIN.CONTACTS.LB_EMAIL_NOT_FOUND' : ''
	};

	$translate.bindAsObject(translations, 'MAIN.COMPOSE');

	function ContactEmail (contact, opts, kind) {
		let inbox = $injector.get('inbox');
		let self = this;

		let tooltip = '';
		let label = '';
		let t = null;
		let isLoadingKey = false;
		let isLoadedKey = false;
		let isCollapsed = true;
		let tag = opts.tag;

		let loadKey = () => co(function *(){
			try {
				let key = yield inbox.getKeyForEmail(self.email);

				self.key = {
					id: key.key_id,
					length: key.length,
					algos: key.algorithm,
					key: key.key
				};

				tooltip = '';
			} catch (err) {
				tooltip = translations['MAIN.CONTACTS.LB_EMAIL_NOT_FOUND'];
				self.key = null;
				throw err;
			} finally {
				isLoadedKey = true;
				isLoadingKey = false;
			}
		});

		if (!opts)
			opts = {};

		label = {
			'private': translations.LB_PRIVATE,
			'business': translations.LB_BUSINESS,
			'hidden': (opts.isNew ? `${translations.LB_NEW} ` : '') + translations.LB_HIDDEN
		}[kind];
		if (!label)
			throw new Error('Invalid contact email kind "' + kind + '"!');

		this.email = opts.email ? opts.email : '';
		this.name = opts.name ? opts.name : '';
		this.isStar = opts.isStar ? opts.isStar : false;
		this.key = opts.key;

		this.isSecured = () => !!self.key;
		this.getSecureClass = () => `sec-${self.isSecured() ? 1 : 0}`;

		this.getFirstName = () => contact ? contact.firstName : '';
		this.getLastName = () => contact ? contact.lastName : '';
		this.getDisplayName = () => contact ? contact.getFullName() : '';
		this.isHidden = () => kind == 'hidden';
		this.isNew = () => !!opts.isNew;
		this.getLabel = () => label;
		this.getTooltip = () => tooltip;
		this.isCollapsed = () => isCollapsed;
		this.getTag = () => tag;

		this.collapse = () => isCollapsed = true;
		this.expand = () => isCollapsed = false;
		this.switchCollapse = () => isCollapsed = !isCollapsed;

		this.loadKey = (isReload = false) => co(function *(){
			if (!isReload) {
				console.log('loadKey', isLoadedKey, isLoadingKey, self.key);
				if (isLoadedKey)
					return self.key;

				if (isLoadingKey) {
					yield co.def(t, null);

					return self.key;
				}
			}

			let domain = self.email.split('@')[1];
			if (domain)
				domain = domain.trim().toLowerCase();

			if (consts.ROOT_DOMAIN_LIST.includes(domain)) {
				isLoadingKey = true;

				let promise;
				[t, promise] = $timeout.schedulePromise(t, () => loadKey(), 1000);
				yield promise;
				console.log('scheduled promise completed');
			} else {
				if (t)
					$timeout.cancel(t);
				isLoadingKey = false;

				tooltip = '';
				self.key = null;
			}

			return self.key;
		});

		this.cancelKeyLoading = () => {
			console.log('cancelKeyLoading for email', self.email, new Error(''));
			if (t)
				$timeout.cancel(t);
			isLoadingKey = false;
		};

		this.isLoadingKey = () => isLoadingKey;
	}

	ContactEmail.newHiddenEmail = email => new ContactEmail(null, {
		name: 'hidden',
		email,
		isNew: true
	}, 'hidden');

	ContactEmail.transform = email => {
		if (!email)
			return null;

		let c = contacts.getContactByEmail(email);
		if (c) {
			let e = c.getEmail(email);
			if (e)
				return e;
		}

		return ContactEmail.newHiddenEmail(email);
	};

	return ContactEmail;
};