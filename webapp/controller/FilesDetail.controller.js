// @ts-nocheck
sap.ui.define([
    "./BaseController",
    "sap/f/LayoutType",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} BaseController
     * @param {typeof sap.f.LayoutType} LayoutType 
     * @param {typeof sap.ui.model.json.JSONModel} JSONModel 
     * @param {sap.m.MessageBox} MessageBox 
     * @param {sap.m.MessageToast} MessageToast 
     * @returns 
     */
    function (BaseController, LayoutType, JSONModel, MessageBox, MessageToast) {
        "use strict";

        return BaseController.extend("dev.vinibar.portal.settings.controller.FilesDetail", {


            /* =========================================================== */
            /* Constants
            /* =========================================================== */
            DELETED_LEVEL: "X",

            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */
            /**
             * Called when the worklist controller is instantiated.
             * @public
             */
            onInit : function () {
                var oViewModel = new JSONModel({
                    busy: true,
                    delay: 0,
                    editable: false,
                    DELETED_LEVEL: this.DELETED_LEVEL
                });

                this.getRouter().getRoute("files").attachPatternMatched(this._onObjectMatched, this);

                // Store original busy indicator delay, so it can be restored later on
                var iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
                this.setModel(oViewModel, "filesDetailView");

                this.getOwnerComponent().getModel().metadataLoaded().then(function () {
                    // Restore original busy indicator delay for the object view
                    oViewModel.setProperty("/delay", iOriginalBusyDelay);
                });
            },

            /* =========================================================== */
            /* event handlers                                              */
            /* =========================================================== */

            /**
             * Event handler for navigating back.
             * We navigate back in the browser history
             * @public
             */
            onNavBack : function () {
                // eslint-disable-next-line sap-no-history-manipulation
                history.go(-1);
            },

            /**
             * Evento chamado ao clicar em fechar
             * @public
             * @param {sap.ui.base.Event} oEvent 
             */
            onClose : function (oEvent) {
                this.onCancel(oEvent);
            },

            /**
             * Evento chamado ao clicar em Editar
             * @public
             * @param {sap.ui.base.Event} oEvent 
             */
            onEdit : function (oEvent) {
                this._toggleEdit();
            },

            /**
             * Evento chamado ao clicar em Adicionar Usuário
             * @public
             * @param {sap.ui.base.Event} oEvent 
             */
            onAddUser : function (oEvent) {
                var sCurrentBindingPath = this.getView().getBindingContext().getPath();
                var sCurrentFileId = this.getModel().getProperty(sCurrentBindingPath + "/Id");
                var oContext = this.getModel().createEntry("/FilesUsers", {
                    properties: {
                        FileId: sCurrentFileId
                    },
                    refreshAfterChange: false,
                    groupId: 'changes'
                });
                var oNewColumnListItem = this.byId("idFilesUsersColumnListItem").clone();
                oNewColumnListItem.bindElement(oContext.getPath());
                this.byId("idFilesUsersTable").addItem(oNewColumnListItem);

            },

            /**
             * Evento chamado ao clicar em Excluir usuário
             * @public
             * @param {sap.ui.base.Event} oEvent 
             */
            onDeleteUser : function (oEvent) {
                var sPath = oEvent.getParameter("listItem").getBindingContext().getPath();
                this.getModel().setProperty(sPath + "/Level", this.DELETED_LEVEL);
                this.getModel().remove(sPath, {
                    groupId: 'changes'
                });
            },

            /**
             * Evento chamado ao clicar em Exibir Mensagens
             * @public
             * @param {sap.ui.base.Event} oEvent
             */
            onShowMessages : function (oEvent) {
                var oShowMessagesButton = oEvent.getSource();
                this.openFragment("dev.vinibar.portal.settings.view.MessagePopover", {
                    id: "idMessagePopover",
                    openBy: oShowMessagesButton,
                });
            },

            /**
             * Evento chamado ao cliacr em Cancelar edição
             * @public
             * @param {sap.ui.base.Event} oEvent 
             */
            onCancel : function (oEvent) {

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
            onConfirm : function (oEvent) {
                this.getModel().resetChanges();
                sap.ui.getCore().getMessageManager().removeAllMessages();
                var oConfirmationPopover = this.byId("idConfirmationPopover");
                var oOpenedBy;
                if (oConfirmationPopover) {
                    oConfirmationPopover.close();
                    oOpenedBy = oConfirmationPopover.getOpenedBy();
                }

                this.getModel("filesDetailView").setProperty("/editable", false);
                // @ts-ignore
                var sId = oOpenedBy ? oOpenedBy.getId() : oEvent.getSource().getId();
                if (sId.includes("idCloseButton")) {
                    this.getModel("filesView").setProperty("/layout", LayoutType.OneColumn);
                    this.getRouter().navTo("files");
                }
            },

            /**
             * Evento chamado ao clicar em Salvar
             * @public
             * @param {sap.ui.base.Event} oEvent 
             */
            onSave : function (oEvent) {
                if (!this.isValid("fileUser")) {
                    MessageBox.error("Verifique os erros e tente novamente");
                    return
                }

                // Atualiza data de modificação
                this.getModel().setProperty(this.getView().getBindingContext().getPath() + "/ModifiedAt", new Date());

                this.getModel().submitChanges({
                    success: function (oData) {
                        if (!this.getModel().hasPendingChanges()) {
                            MessageToast.show("Atualizado com sucesso");
                            this._toggleEdit();
                        }
                    }.bind(this)
                });
            },

            /* =========================================================== */
            /* internal methods                                            */
            /* =========================================================== */
            /**
             * Binds the view to the object path.
             * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
             * @private
             */
            _onObjectMatched : function (oEvent) {
                var sObjectId = oEvent.getParameter("arguments").objectId;
                var sLayout = sObjectId ? LayoutType.TwoColumnsBeginExpanded : LayoutType.OneColumn;
                this.getModel("filesView").setProperty("/layout", sLayout);
                this.getModel("filesDetailView").setProperty("/editable", false);

                if (!sObjectId) return;
                var sObjectPath = this.getModel().createKey("/Files", {
                    Id: sObjectId
                });

                var oViewModel = this.getModel("filesDetailView");
                this.getView().bindElement({
                    path: sObjectPath,
                    events: {
                        change: this._onBindingChange.bind(this),
                        dataRequested: function () {
                            oViewModel.setProperty("/busy", true);
                        },
                        dataReceived: function () {
                            oViewModel.setProperty("/busy", false);
                        }
                    }
                })

            },

            /**
             * Validações realizadas ao trocar o bind da view
             * @private
             * @returns 
             */
            _onBindingChange : function () {
                var oViewModel = this.getModel("filesDetailView");
                var oElementBinding = this.getView().getElementBinding();

                // No data for the binding
                if (!oElementBinding.getBoundContext()) {
                    this.getRouter().getTargets().display("notFound");
                    return;
                }

                oViewModel.setProperty("/busy", false);
            },

            /**
             * Alterna modo de edição
             * @private
             */
            _toggleEdit : function () {
                var oModel = this.getModel("filesDetailView");
                var bEditable = !oModel.getProperty("/editable");
                oModel.setProperty("/editable", bEditable);
            },

        });

    });