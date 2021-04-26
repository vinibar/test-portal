// @ts-nocheck
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/Fragment",
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 * @param {typeof sap.ui.core.UIComponent} UIComponent
	 * @param {typeof sap.ui.core.Fragment} Fragment
	 **/
	function (Controller, UIComponent, Fragment) {
		"use strict";

		return Controller.extend("dev.vinibar.portal.settings.controller.BaseController", {

			/**
			 * Convenience method for accessing the router.
			 * @public
			 * @returns {sap.ui.core.routing.Router} the router for this component
			 */
			getRouter: function () {
				return UIComponent.getRouterFor(this);
			},

			/**
			 * Convenience method for getting the view model by name.
			 * @public
			 * @param {string} [sName] the model name
			 * @returns {sap.ui.model.Model} the model instance
			 */
			getModel: function (sName) {
				return this.getView().getModel(sName);
			},

			/**
			 * Convenience method for setting the view model.
			 * @public
			 * @param {sap.ui.model.Model} oModel the model instance
			 * @param {string} sName the model name
			 * @returns {sap.ui.core.mvc.View} the view instance
			 */
			setModel: function (oModel, sName) {
				return this.getView().setModel(oModel, sName);
			},

			/** 
			 * Evento disparado ao clicar em algum link da aplicação
			 * @public
			 * @param {sap.ui.base.Event} oEvent
			 */
			onLinkPress: function (oEvent) {
				debugger
				var sKey = oEvent.getSource().data("key");
				this.getRouter().navTo(sKey);
			},

			/**
			 * Carrega um fragment
			 * Esse método foi criado para facilitar o abertura de um fragment e deixar o código
			 * das controllers menos "sujo". 
			 * Para utilizar é necesário passar o @param sName com o nome do fragment
			 * e, se necessário, os parâmetros adicionais. São eles:
			 * 
			 * @typedef {Object} mParameters
			 * @property {String} id Id definido no XML
			 * @property {String} title  Título da Dialog
			 * @property {String} bindingPath BindinPath caso haja necessidade de fazer um bindElment
			 * @property {String} openBy Control que abriu a dialog
			 * 
			 * @public
			 * @param {String} sName Nome do Fragment
			 * @param {mParameters} mParameters Parâmetros 
			 * @returns {Promise}
			 */
			loadFragment: function (sName, mParameters) {
				var oDialog;
				if (mParameters.id)
					oDialog = this.byId(mParameters.id);

				if (oDialog) {
					if (mParameters.bindingPath)
						oDialog.bindElement(mParameters.bindingPath);
					return new Promise(function (resolve, reject) {
						resolve(oDialog);
					});
				}

				return Fragment.load({ id: this.getView().getId(), name: sName, controller: this })
					.then(function (oDialog) {
						if (mParameters.bindingPath)
							oDialog.bindElement(mParameters.bindingPath);
						if (mParameters.title)
							oDialog.setTitle(mParameters.title);
						if (mParameters.openBy) {
							oDialog._openedBy = mParameters.openBy;
							oDialog.getOpenedBy = function () {
								return this._openedBy;
							}
						}
						return oDialog;
					}.bind(mParameters))
					.then(function (oDialog) {
						this.getView().addDependent(oDialog);
						return oDialog;
					}.bind(this));
			},

			/**
			 * Carrega e abre um fragment específico
			 * @public
			 * @param {String} sName Nome do Fragment
			 * @param {mParameters} mParameters Parâmetros
			 */
			openFragment: function (sName, mParameters) {
				this.loadFragment(sName, mParameters).then(function (oDialog) {
					var oOpenByControl = mParameters.openBy;
					if (oOpenByControl)
						oDialog.openBy(oOpenByControl);
					else
						oDialog.open()
				}.bind(mParameters));
			},

			/**
			 * Impede que um input com value help seja livre para digitação
			 * @public
			 * @param {sap.ui.base.Event} oEvent 
			 */
			preventSmartFieldTyping: function (oEvent) {
				oEvent.getParameters()[0].setValueHelpOnly(true);
			},

			/**
			 * Getter for the resource bundle.
			 * @public
			 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
			 */
			getResourceBundle: function () {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle();
			},

			/**
			 * Verifica o ValueState dos campos para decidir se as informações estão válidas para
			 * irem ao backend ou não
			 * @public
			 * @returns {boolean}
			 */
			isValid: function (sGroupId) {
				var aInputControls = this.getView().getControlsByFieldGroupId(sGroupId);
				for (var i in aInputControls) {
					try {
						if (aInputControls[i].getValueState() === "Error") {
							return false;
						}
					} catch (e) {
						//nothing to do
					}
				}
				return true;
			}

		});

	});