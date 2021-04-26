sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
],
    /**
     * 
     * @param {typeof sap.ui.core.mvc.Controller} BaseController 
     * @param {typeof sap.ui.model.json.JSONModel} JSONModel 
     * @param {typeof sap.m.MessageToast} MessageToast
     * @param {typeof sap.m.MessageBox} MessageBox
     */

    function (BaseController, JSONModel, MessageToast, MessageBox) {
        "use strict";

        return BaseController.extend("dev.vinibar.portal.settings.controller.Contacts", {

            /* =========================================================== */
            /* Constants                                                   */
            /* =========================================================== */
            DELETED_PHONE: "XX_DELETED_XX",
            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */

            /**
             * onInit
             * @public
             */
            onInit: function () {

                var oViewModel = new JSONModel({
                    busy: true,
                    editable: false,
                    deletedPhone: this.DELETED_PHONE
                });

                this.getRouter().getRoute("contacts").attachPatternMatched(this._onRouteMatched, this);

                // Store original busy indicator delay, so it can be restored later on
                var iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
                this.setModel(oViewModel, "contactsView");

                this.getOwnerComponent().getModel().metadataLoaded().then(function () {
                    // Restore original busy indicator delay for the object view
                    oViewModel.setProperty("/delay", iOriginalBusyDelay);
                });

            },

            /* =========================================================== */
            /* event handlers                                              */
            /* =========================================================== */

            /**
             * Evento chamado ao realizar uma busca
             * @public
             * @param {sap.ui.base.Event} oEvent 
             */
            onSearch: function (oEvent) {
                this.byId("idContactsTable").rebindTable(true);
            },

            /**
             * Evento onBeforeRebind da SmartTable
             * @public
             * @param {sap.ui.base.Event} oEvent 
             */
            onRebindContactsTable: function (oEvent) {
                var sSearchQuery = this.byId("idSearch").getValue();
                var mBindingParams = oEvent.getParameter("bindingParams");
                mBindingParams.parameters["custom"] = { "search": sSearchQuery };
            },

            /**
             * Evento chamado ao clicar em editar
             * @public
             * @param {sap.ui.base.Event} oEvent 
             */
            onEdit: function (oEvent) {
                this._toggleEdit();
            },

            /**
             * Evento chamado ao clicar em Adicionar Contato
             * @public
             * @param {sap.ui.base.Event} oEvent 
             */
            onAdd: function (oEvent) {
                var oContext = this.getModel().createEntry("/Contacts", {
                    properties: {},
                    refreshAfterChange: false
                });
                var oNewColumnListItem = this.byId("idContactsColumnListItem").clone();
                oNewColumnListItem.bindElement(oContext.getPath());
                this.byId("idContactsTable").getTable().addItem(oNewColumnListItem);
            },

            onDelete: function (oEvent) {
                var sPath = oEvent.getParameter("listItem").getBindingContext().getPath();
                this.getModel().setProperty(sPath + "/Phone", this.DELETED_PHONE);
                this.getModel().remove(sPath, {
                    groupId: 'changes'
                });
            },

            /**
             *  Evento chamado ao cliacr em Salvar
             * @public
             * @param {sap.ui.base.Event} oEvent 
             */
            onSave: function (oEvent) {
                this.getModel().submitChanges({
                    success: function (oData) {
                        if (!this.getModel().hasPendingChanges()) {
                            MessageToast.show("Contatos atualizados com sucesso");
                            this._toggleEdit();
                        }
                    }.bind(this)
                });
            },

            /**
             * Evento chamado ao cliacr em Cancelar edição
             * @public
             * @param {sap.ui.base.Event} oEvent 
             */
            onCancel: function (oEvent) {

                if (!this.getModel().hasPendingChanges()) {
                    this.onConfirm(oEvent);
                    return
                }

                var oCancelButton = oEvent.getSource();
                this.openFragment("dev.vinibar.portal.settings.view.ConfirmationPopover", {
                    id: "idConfirmationPopover",
                    openBy: oCancelButton,
                    title: "As modificações serão perdidas. Deseja continuar?"
                });

            },

            /**
             * Evento chamado ao clicar em confirmar (tanto fechamento ou cancelamento)
             * @public
             * @param {sap.ui.base.Event} oEvent 
             */
            onConfirm: function (oEvent) {
                this.getModel().resetChanges();
                sap.ui.getCore().getMessageManager().removeAllMessages();
                var oConfirmationPopover = this.byId("idConfirmationPopover");
                var oOpenedBy;
                if (oConfirmationPopover) {
                    oConfirmationPopover.close();
                    oOpenedBy = oConfirmationPopover.getOpenedBy();
                }
                this.getModel("contactsView").setProperty("/editable", false);
            },

            /**
             * Converte texto digitado para uppercase
             * @public
             * @param {sap.ui.base.Event} oEvent 
             */
            toUpperCase: function (oEvent) {
                oEvent.getSource().setValue(oEvent.getParameter("newValue").toUpperCase());
            },

            /**
             * Evento chamado ao clicar em Exibir Mensagens
             * @public
             * @param {sap.ui.base.Event} oEvent
             */
            onShowMessages: function (oEvent) {
                var oShowMessagesButton = oEvent.getSource();
                this.openFragment("dev.vinibar.portal.settings.view.MessagePopover", {
                    id: "idMessagePopover",
                    openBy: oShowMessagesButton,
                });
            },


            /* =========================================================== */
            /* Internal Methods                                            */
            /* =========================================================== */

            /**
             * Processos quando o usuário navegar para essa view
             * @private
             * @param {sap.ui.base.Event} oEvent 
             */
            _onRouteMatched: function (oEvent) {              
                this.getModel("contactsView").setProperty("/editable", false);
            },

            /**
             * Troca estado entre Editar/Visualizar
             * @private
             * @param {sap.ui.base.Event} oEvent 
             */
            _toggleEdit: function (oEvent) {
                var bEditable = !this.getModel("contactsView").getProperty("/editable");
                this.getModel("contactsView").setProperty("/editable", bEditable);
            }

        });

    });
