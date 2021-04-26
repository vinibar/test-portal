sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/message/ControlMessageProcessor",
	"sap/m/MessageBox",
	"sap/ui/core/MessageType",
	"sap/ui/core/ValueState"
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} BaseController
	 * @param {typeof sap.ui.model.json.JSONModel} JSONModel
	 * @param {typeof sap.ui.core.message.ControlMessageProcessor} ControlMessageProcessor
	 * @param {typeof sap.m.MessageBox} MessageBox
	 * @param {typeof sap.ui.core.message.Message} Message
	 * @param {typeof sap.ui.core.MessageType} MessageType
	 * @param {typeof sap.ui.core.ValueState} ValueState
	 * @returns 
	 */
	function (BaseController, JSONModel, ControlMessageProcessor, MessageBox, Message, MessageType, ValueState) {
		"use strict";

		return BaseController.extend("dev.vinibar.portal.settings.controller.App", {

			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			/**
			 * onInit
			 * @public
			 */
			onInit: function () {
				var oViewModel,
					fnSetAppNotBusy,
					iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

				oViewModel = new JSONModel({
					busy: true,
					delay: 0,
					selectedItem: "files",
					paramsExpanded: true,
					sideBarExpanded: true,
					breadcrumbLinks: [{}]
				});
				this.setModel(oViewModel, "appView");

				fnSetAppNotBusy = function () {
					oViewModel.setProperty("/busy", false);
					oViewModel.setProperty("/delay", iOriginalBusyDelay);
				};

				// disable busy indication when the metadata is loaded and in case of errors
				this.getOwnerComponent().getModel().metadataLoaded().
					then(fnSetAppNotBusy);
				this.getOwnerComponent().getModel().attachMetadataFailed(fnSetAppNotBusy);

				// apply content density mode to root view
				this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

				var oMessageProcessor = new ControlMessageProcessor();
				var oMessageManager = sap.ui.getCore().getMessageManager();
				oMessageManager.registerMessageProcessor(oMessageProcessor);

				sap.ui.getCore().attachValidationError(
					function (oEvent) {
						var oElement = oEvent.getParameter("element");
						var oMessage = oEvent.getParameter('message');
						var oInput = sap.ui.getCore().byId(oElement.getId());
						oInput.setValueState(ValueState.Error);
						debugger;
						oMessageManager.addMessages(
							new Message({
								message: oMessage,
								type: MessageType.Error,
								target: "/name",
								processor: oMessageProcessor
							})
						);
					});

				this.getRouter().attachRouteMatched(this._onRouteMatched.bind(this));
			},


			/**
			 * Evento chamado ao clicar em um item do menu
			 * @public
			 * @param {sap.ui.base.Event} oEvent 
			 */
			onItemSelect: function (oEvent) {

				// ao clicar em "params" apenas alterna entre expandido e recolhido
				var sKey = oEvent.getParameter("item").getKey();
				if (sKey === "params") {
					this._toggleItemExpand();
				}

				function navToView() {
					this.getRouter().navTo(sKey);
				}

				if (this.getModel().hasPendingChanges()) {
					MessageBox.confirm("Os dados não salvos serão perdidos.", {
						onClose: function (sAction) {
							if (sAction == MessageBox.Action.OK) {
								this.getModel().resetChanges();
								navToView.call(this);
							}
						}.bind(this)
					})
				} else {
					navToView.call(this);
				}

			},

			/**
			 * Processos quando o usuário navegar para essa view
			 * @protected
			 * @param {sap.ui.base.Event} oEvent
			 */
			_onRouteMatched: function (oEvent) {
				this._updateBreadcrumbs(oEvent.getParameter("config").pattern);
			},

			/**
			 * Atualiza os breadcrumbs das ObjectPages com o caminho correto
			 * @private
			 * @param {String} sTargetPath String com target do Router
			 */
			_updateBreadcrumbs: function (sTargetPath) {
				// O Home sempre vai existir 
				var aLinks = [{ key: "main", text: this.getResourceBundle().getText("main") }];

				// Mapeia o target para os breadcrumbs
				
				var sParentPath = sTargetPath.replace(/\/\:.+\:/, "");
				var aTargets = sParentPath.split('/');
				aTargets.pop()
				for (var i in aTargets) {
					aLinks.push({
						key: aTargets[i],
						text: this.getResourceBundle().getText(aTargets[i])
					});
				}

				this.getModel("appView").setProperty("/breadcrumbLinks", aLinks);
			},

			/**
			* Troca estado do item entre Expanded/Collapsed 
			* @private
			 */
			_toggleItemExpand: function () {
				var bItemExpanded = this.getModel("appView").getProperty("/paramsExpanded");
				this.getModel("appView").setProperty("/paramsExpanded", !bItemExpanded);
			},

			/**
			 * Troca estado do menu lateral entre Expanded/Collapsed
			 * @private
			 */
			onMenu: function () {
				var bExpanded = this.getModel("appView").getProperty("/sideBarExpanded");
				this.getModel("appView").setProperty("/sideBarExpanded", !bExpanded);
			}

		})
	});