# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License Version
# 1.1 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
# for the specific language governing rights and limitations under the
# License.
#
# The Original Code is Tab Sidebar Display.
#
# The Initial Developer of the Original Code is
#      Dave Townsend <dtownsend@oxymoronical.com>.
#
# Portions created by the Initial Developer are Copyright (C) 2007
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#
# Alternatively, the contents of this file may be used under the terms of
# either the GNU General Public License Version 2 or later (the "GPL"), or
# the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the GPL or the LGPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK *****
var TabSidebarHandler = {

// Variables
prefs: null,
hidden: false,
doc: null,
position: 0,
oldToggleAffectedChrome: null,
lastState: false,
showPreviews: true,

ORIENTATION_VERTICAL: 0,
ORIENTATION_HORIZONTAL: 1,

// Constructor and destructor
init: function() {
  window.addEventListener("load", TabSidebarHandler.load, false);
  window.addEventListener("unload", TabSidebarHandler.unload, false);

  this.doc = document;

  this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
                        .getService(Components.interfaces.nsIPrefService)
                        .getBranch("extensions.tabsidebar.")
                        .QueryInterface(Components.interfaces.nsIPrefBranch2);

  var sidebarBox = this.doc.getElementById("sidebar-box");
  var sidebar = this.doc.getElementById("sidebar");

  sidebarBox.addEventListener("DOMAttrModified", TabSidebarHandler.attributeListener, false);
  sidebar.addEventListener("load", TabSidebarHandler.sidebarLoad, true);

  this.position = this.prefs.getIntPref("position");
  this.showPreviews = this.prefs.getBoolPref("content.previews");

  this.prefs.addObserver("", this, false);
},

unload: function() {
  window.removeEventListener("unload", TabSidebarHandler.unload, false);
  TabSidebarHandler.prefs.removeObserver("", TabSidebarHandler);
  if (TabSidebarHandler.isOpen()) {
    var previews = TabSidebarHandler.getPreviews();
    TabSidebarHandler.sidebarDestroy();
    previews._destroy();
  }
  TabSidebarHandler.doc = null;
  TabSidebarHandler.prefs = null;
},

getOrientation: function() {
  if (this.position == 0 || this.position > 2)
    return this.ORIENTATION_VERTICAL;
  return this.ORIENTATION_HORIZONTAL;
},

getPreviews: function() {
  if (this.position == 0)
    return sidebar.contentDocument.documentElement;
  else
    return this.getContainer().firstChild;
},

getContainer: function() {
  var container = null;

  switch (this.position) {
    case 1:
      container = document.getElementById("tabsidebar-top-container");
      break;
    case 2:
      container = document.getElementById("tabsidebar-bottom-container");
      break;
    case 3:
      container = document.getElementById("tabsidebar-left-container");
      break;
    case 4:
      container = document.getElementById("tabsidebar-right-container");
      break;
  }
  return container;
},

getSplitter: function() {
  var splitter = null;

  switch (this.position) {
    case 1:
      splitter = document.getElementById("tabsidebar-top-splitter");
      break;
    case 2:
      splitter = document.getElementById("tabsidebar-bottom-splitter");
      break;
    case 3:
      splitter = document.getElementById("tabsidebar-left-splitter");
      break;
    case 4:
      splitter = document.getElementById("tabsidebar-right-splitter");
      break;
  }
  return splitter;
},

createPreviews: function(container) {
  var previews = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "tabpreviews");
  if (this.getOrientation() == this.ORIENTATION_VERTICAL)
    previews.setAttribute("class", "tbs-tabpreviews tbs-tabpreviews-vertical");
  else
    previews.setAttribute("class", "tbs-tabpreviews tbs-tabpreviews-horizontal");
  previews.setAttribute("flex", "1");
  previews.setAttribute("id", "tabsidebar-previews");
  container.appendChild(previews);
},

toggleSidebar: function() {
  if (this.position == 0) {
    toggleSidebar('viewTabSidebar');
    return;
  }
  var command = document.getElementById("viewTabSidebar");
  var container = this.getContainer();
  var previews = this.getPreviews();
  var splitter = this.getSplitter();
  if (this.isOpen()) {
    this.sidebarDestroy();
    previews._destroy();
    container.removeChild(container.firstChild);
    container.setAttribute("hidden", "true");
    splitter.setAttribute("hidden", "true");
    command.setAttribute("checked", "false");
  }
  else {
    container.setAttribute("hidden", "false");
    if (this.showPreviews || (this.getOrientation() == this.ORIENTATION_VERTICAL)) {
      splitter.setAttribute("hidden", "false");
      container.style.minHeight = null;
    }
    else {
      container.removeAttribute("height");
      container.style.minHeight = "0px";
    }
    this.createPreviews(container);
    this.sidebarInitialise();
    command.setAttribute("checked", "true");
  }
},

sidebarLoad: function(event) {
  var sidebar = TabSidebarHandler.doc.getElementById("sidebar");
  if (sidebar.contentDocument == event.target) {
    if (sidebar.parentNode.getAttribute("sidebarcommand") == "viewTabSidebar" &&
        sidebar.currentURI.spec == "about:blank")
      sidebar.contentDocument.documentElement.style.backgroundColor = "-moz-dialog";
  }
},

// Sidebar opening and closing
sidebarInitialise: function() {
  if (this.prefs.getBoolPref("hidetabs"))
    this.hideTabbar();
},

sidebarDestroy: function() {
  this.showTabbar();
},

isOpen: function() {
  if (this.position == 0) {
    var sidebarBox = this.doc.getElementById("sidebar-box");
    return sidebarBox.getAttribute("sidebarcommand") == "viewTabSidebar";
  }
  else {
    var container = this.getContainer();
    return !container.hidden;
  }
},

showTabbar: function() {
  if (!this.hidden)
    return;
  var tabbrowser = this.doc.getElementById("content");
  tabbrowser.removeAttribute("hidetabs");
  this.hidden = false;
},

hideTabbar: function() {
  if (this.hidden)
    return;
  var tabbrowser = this.doc.getElementById("content");
  tabbrowser.setAttribute("hidetabs", "true");
  this.hidden = true;
},

// Event observers
load: function(event) {
  var sidebarBox = TabSidebarHandler.doc.getElementById("sidebar-box");
  sidebarBox.removeEventListener("DOMAttrModified", TabSidebarHandler.attributeListener, false);
  window.removeEventListener("load", TabSidebarHandler.load, false);
  if ((TabSidebarHandler.position != 0) && (TabSidebarHandler.isOpen())) {
    var container = TabSidebarHandler.getContainer();
    if ((TabSidebarHandler.getOrientation() == TabSidebarHandler.ORIENTATION_HORIZONTAL) &&
        !TabSidebarHandler.showPreviews) {
      container.removeAttribute("height");
      container.style.minHeight = "0px";
    }
    var command = document.getElementById("viewTabSidebar");
    TabSidebarHandler.createPreviews(container);
    TabSidebarHandler.sidebarInitialise();
    command.setAttribute("checked", "true");
  }
  TabSidebarHandler.oldToggleAffectedChrome = window.toggleAffectedChrome;
  window.toggleAffectedChrome = TabSidebarHandler.toggleAffectedChrome;
},

observe: function (subject, topic, data) {
  if (data == "hidetabs") {
    if (this.isOpen()) {
      if (this.prefs.getBoolPref(data))
        this.hideTabbar();
      else
        this.showTabbar();
    }
  }
  else if (data == "position") {
    var open = this.isOpen();
    if (open)
      this.toggleSidebar();
    this.position = this.prefs.getIntPref(data);
    if (open)
      this.toggleSidebar();
  }
  else if (data == "content.previews") {
    this.showPreviews = this.prefs.getBoolPref(data);
    if (this.isOpen() && (this.getOrientation() == this.ORIENTATION_HORIZONTAL)) {
      var container = this.getContainer();
      var splitter = this.getSplitter();
      splitter.setAttribute("hidden", this.showPreviews ? "false" : "true");
      if (!this.showPreviews) {
        container.removeAttribute("height");
        container.style.minHeight = "0px";
        var previews = this.getPreviews().previews;
        for (var i = 0; i < previews.length; i++)
          previews[i].style.width = null;
      }
      else {
        container.style.minHeight = null;
      }
    }
  }
},

toggleAffectedChrome: function(aHide) {
  TabSidebarHandler.oldToggleAffectedChrome(aHide);
  if (TabSidebarHandler.position != 0) {
    if (aHide) {
      TabSidebarHandler.lastState = TabSidebarHandler.isOpen();
      if (TabSidebarHandler.lastState)
        TabSidebarHandler.toggleSidebar();
    }
    else {
      if (TabSidebarHandler.lastState)
        TabSidebarHandler.toggleSidebar();
    }
  }
},

attributeListener: function(event) {
  if (event.eventPhase == Event.AT_TARGET) {
    if (event.attrName == "sidebarcommand") {
      if (event.newValue == "viewTabSidebar")
        TabSidebarHandler.sidebarInitialise();
      else if (event.prevValue == "viewTabSidebar")
        TabSidebarHandler.sidebarDestroy();
    }
  }
}

}

TabSidebarHandler.init();
