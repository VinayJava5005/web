window.primaryApplicationName = 'AppLavaboom';
angular.module(primaryApplicationName, [
	'lavaboom.api',
	'ngSanitize',
	'ui.router',
	'ui.bootstrap',
	'ui.select',
	'textAngular',
	'pascalprecht.translate'
	]);

window.coJS = require('co');

var bulkRequire = require('bulk-require');

bulkRequire(__dirname, [
	'../runs/*.js',
	'../configs/*.js',
	'../directives/*.js',
	'../services/*.js',

	'./AppLavaboom/filters/*.js',
	'./AppLavaboom/configs/*.js',
	'./AppLavaboom/directives/*.js',
	'./AppLavaboom/services/*.js',
	'./AppLavaboom/controllers/*.js'
]);