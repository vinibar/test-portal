/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function() {
	"use strict";

	sap.ui.require([
		"dev/vinibar/portal/settings/test/integration/AllJourneys"
	], function() {
		QUnit.start();
	});
});