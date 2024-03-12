import * as vscode from 'vscode';
import { ViewBadge } from 'vscode';
import {Controller} from './controller';
import {BookmarkTreeItem} from './bookmark_tree_item';
import { Bookmark, Group } from './functional_types';
import * as util from './util'

class MyViewBadge implements ViewBadge {
    tooltip: string;
    value: number;
    public constructor(value: number=0) {
        this.value = value
        this.tooltip = `${this.value} bookmarks`
    }
}

export class BookmarkTreeViewManager {

    private controller: Controller | null = null;

    private treeDataProviderByGroup: any = null;
    private treeDataProviderByFile: any = null;
    public view: any = null

    public refreshCallback() {
        if (this.treeDataProviderByGroup !== null) {
            this.treeDataProviderByGroup.refresh();
        }
        this.refresh_badge()
    }

    public async init(controller: Controller) {
        this.controller = controller;
        this.treeDataProviderByGroup = this.controller.tprovider;
        this.controller.tprovider.treeview = this;
        // this.treeDataProviderByFile = this.controller.getTreeDataProviderByFile();
        // vscode.TreeViewOptions
        let view = vscode.window.createTreeView('bookmarksByGroup', {
            treeDataProvider: this.treeDataProviderByGroup, 
            dragAndDropController: this.treeDataProviderByGroup,
            showCollapseAll: true, canSelectMany: true
        });
        // view.message = "∠( ᐛ 」∠)_"  // clear message and show welcome
        view.description = "manage your bookmarks"
        this.view = view
    }
    public refresh_badge() {
        let num = this.controller!.fake_root_group.cache.bookmark_num()
        this.view.badge = new MyViewBadge(num)
    }

    public activateGroup(treeItem: BookmarkTreeItem) {
        const group = treeItem.getBaseGroup();
        const activeGroup = this.controller!.activeGroup;
        if (group === null || activeGroup.get_full_uri() === group.get_full_uri()) {
            // switch to root group
            this.controller!.activateGroup("");
            vscode.window.showInformationMessage(`切换至root group`);
            return;
        }
        vscode.window.showInformationMessage(`切换至${group.get_full_uri()}`);
        this.controller!.activateGroup(group.get_full_uri());
    }

    public deleteGroup(treeItem: BookmarkTreeItem) {
        const group = treeItem.getBaseGroup();
        this.controller!.deleteGroups(group!);
        vscode.window.showInformationMessage(`删除${group!.get_full_uri()}成功`);
    }

    public deleteBookmark(treeItem: BookmarkTreeItem) {
        const bookmark = treeItem.getBaseBookmark();
        this.controller!.deleteBookmark(bookmark!);
    }

    public addSubGroup(treeItem: BookmarkTreeItem) {
        const group = treeItem.getBaseGroup()!;
        this.controller!.addGroupInputBox().then((name: String) => {
            let uri = util.joinTreeUri([group.get_full_uri(), name])
            this.controller!.addGroup(uri);
        })
    }

    public editNodeLabel(treeItem: BookmarkTreeItem) {
        const node = treeItem.base;
        if (node) {
            vscode.window.showInputBox({
                placeHolder: '请输入标签文本',
                value: node.name
            }).then((label) => {
                if (label) {
                    if (label === node.name) {
                        vscode.window.showInformationMessage("edit info: label unchanged");
                    } else if (!this.controller!.editNodeLabel(node, label)) {
                        vscode.window.showInformationMessage("edit fail: label exists!");
                    }
                }
                this.controller!.updateDecorations();
            });        
        } else {
            vscode.window.showInformationMessage("node is null");
        }
    }
}