/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Tab Sidebar Display.
 *
 * The Initial Developer of the Original Code is
 *      Dave Townsend <dave.townsend@blueprintit.co.uk>.
 *
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK *****
 *
 * $HeadURL$
 * $LastChangedBy$
 * $Date$
 * $Revision$
 *
 */
var previews = null;

var sidebar = {

hidden: false,

onResize: function(event)
{
	previews.onResize();
},

init: function()
{
	previews = document.getElementById("previews");
	window.parent.addEventListener("resize",sidebar.onResize,false);
	
	var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                        .getService(Components.interfaces.nsIPrefService)
                        .getBranch("tabsidebar.");
  if (prefs.getBoolPref("hidetabs"))
  {
  	sidebar.hidden=true;
  	var tabbrowser = window.parent.document.getElementById("content");
  	var tabstrip = window.parent.document.getAnonymousElementByAttribute(tabbrowser,"class","tabbrowser-strip");
  	tabstrip.style.display="none";
  }
},
 
destroy: function()
{
	window.parent.removeEventListener("resize",sidebar.onResize,false);
	
	if (sidebar.hidden)
	{
  	var tabbrowser = window.parent.document.getElementById("content");
  	var tabstrip = window.parent.document.getAnonymousElementByAttribute(tabbrowser,"class","tabbrowser-strip");
  	tabstrip.style.display=null;
	}
},
}
