//@ts-nocheck
sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/f/LayoutType",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/FilterType"
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} BaseController
	 * @param {typeof sap.ui.model.json.JSONModel} JSONModel
	 * @param {typeof sap.f.LayoutType} LayoutType
	 * @param {typeof sap.m.MessageBox} MessageBox
	 * @param {typeof sap.m.MessageToast} MessageToast
	 * @param {typeof sap.ui.model.Filter} Filter
	 * @param {typeof sap.ui.model.FilterOperator} FilterOperator
	 * @param {typeof sap.ui.model.FilterType} FilterType
	 */
	function (BaseController, JSONModel, LayoutType, MessageBox, MessageToast, Filter, FilterOperator, FilterType) {
		"use strict";

		return BaseController.extend("dev.vinibar.portal.settings.controller.Files", {

			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			/**
			 * Evento chamado quando a controller Files é iniciada
			 * @public
			 */
			onInit: function () {
				this.setModel(new JSONModel({
					layout: LayoutType.OneColumn
				}), "filesView");
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */

			/**
			 * Evento chamado ao clicar em "Criar"
			 * Será aberta uma Dialog para inserir os dados do arquivo
			 * que será criado
			 * @param {sap.ui.base.Event} oEvent
			 * @public
			 */
			onOpenCreateDialog: function (oEvent) {
				var oContext = this.getModel().createEntry("/Files", {
					properties: {},
					success: function (oData) {
						this.onCloseCreateDialog();
						MessageToast.show("Arquivo criado com sucesso");
					}.bind(this),
					error: function (oError) {
						MessageBox.error("Ocorreu um erro ao tentar criar um arquivo");
					}
				});

				this.openFragment("dev.vinibar.portal.settings.view.FilesCreate", {
					id: "idFilesCreateDialog",
					bindingPath: oContext.getPath()
				});
			},

			/**
			 * Evento chamado ao fechar dialog de criação 
			 * @param {sap.ui.base.Event} oEvent
			 * @public
			 */
			onCloseCreateDialog: function (oEvent) {
				var oDialog = this.byId("idFilesCreateDialog");
				if (oDialog)
					oDialog.close();
				this.getModel().resetChanges();
			},

			/**
			 * Evento chamado ao clicar em "Salvar" na dialog de
			 * criação de arquivo
			 * @param {sap.ui.base.Event} oEvent
			 */
			onCreate: function (oEvent) {
				this.getModel().submitChanges();
			},

			/**
			 * Evento chamado ao clicar em remover arquivo da lista
			 * Há algumas validações que devem ser feitas antes de realizar a exclusão
			 * @param {sap.ui.base.Event} oEvent 
			 * @public
			 */
			onDelete: function (oEvent) {

				var sPath = oEvent.getParameter("listItem").getBindingContextPath();
				this.getModel().remove(sPath, {
					groupId: "deleteFile",
					success: function (sPath) {

						// Se o registro excluido estiver aberto, fecha
						var sRouteHash = this.getRouter().getHashChanger().getHash();
						var sCurrentOpened = this.getRouter().getRouteInfoByHash(sRouteHash).arguments.objectId;
						if (sPath.includes(sCurrentOpened))
							this.getRouter().navTo("files");

						MessageToast.show("Arquivo excluído com sucesso");
					}.bind(this, sPath)
				});

				var oDeleteButton = oEvent.getParameter("listItem").getDeleteControl();
				this.openFragment("dev.vinibar.portal.settings.view.ConfirmationPopover", {
					id: "idConfirmationPopover",
					openBy: oDeleteButton,
					title: "Tem certeza que deseja excluir?"
				});

			},

			/**
			 * Evento chamado ao confirmar que o registro deve ser excluído
			 * Quando um usuário tenta excluir um registro, um Popover é apresentado
			 * questionando sua decisão. Ao confirmar, esse evento é chamado.
			 * @param {sap.ui.base.Event} oEvent
			 * @public
			 */
			onConfirm: function (oEvent) {
				this.getModel().submitChanges({
					groupId: "deleteFile"
				});
				this.byId("idConfirmationPopover").close();
				return;
			},

			onCloseDeleteConfirmation: function (oEvent) {
				this.getModel().resetChanges();
			},

			/**
			 * Evento chamado ao clicar em VOLTAR no navegador
			 * @public
			 */
			onNavBack: function () {
				// eslint-disable-next-line sap-no-history-manipulation
				history.go(-1);
			},

			/**
			 * Evento chamado ao clicar sobre um arquivo listado na tabela
			 * @param {sap.ui.base.Event} oEvent 
			 * @public
			 */
			showDetail: function (oEvent) {

				var sID = oEvent.getParameter("listItem").getBindingContext().getProperty("Id");
				function navToDetail() {

					this.getModel().resetChanges();
					this.getRouter().navTo("files", {
						objectId: sID
					});
				}

				if (this.getModel().hasPendingChanges()) {
					MessageBox.confirm("Os dados não salvos serão perdidos.", {
						onClose: function (sAction) {
							if (sAction == MessageBox.Action.OK) {
								navToDetail.call(this);
							}
						}.bind(this)
					})
				} else {
					navToDetail.call(this);
				}
			},

			/**
			 * Evento chamado ao realizar uma busca
			 * @param {sap.ui.base.Event} oEvent 
			 */
			onSearch: function (oEvent) {
				var sValue = oEvent.getParameter("query");
				var oFilter = new Filter("Title", FilterOperator.Contains, sValue);
				this.byId("idFilesTable").getBinding("items").filter(oFilter, FilterType.Application);
			}
		});

	});