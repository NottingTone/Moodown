// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * UON Course Overview YUI
 *
 * @package    block
 * @subpackage course_overview
 * @copyright  2014 University of Nottingham <http://nottingham.ac.uk>
 * @copyright  2014 Catalyst IT <http://catalyst-eu.net>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

YUI.add('moodle-block_new_course_overview-mymodules', function(Y) {

    var MYMODULESNAME = 'block_new_course_overview_mymodules';

    var MYMODULES = function() {
        MYMODULES.superclass.constructor.apply(this, arguments);
    };

    Y.extend(MYMODULES, Y.Base, {
        initializer : function(config) {
            var tabNode = Y.one('#block-mymodules-new-overview');
            var instance = this;
            if (tabNode) {
                var tabview = new Y.TabView({
                    srcNode: '#block-mymodules-new-overview'
                });
                tabview.render();
                this.expandable(tabNode);

                // Set listeners for tab click contents updating.
                tabNode.all('ul.block-mymodules-new-overview-list li.yui3-tab a').on('click', function(e) {
                    if (!e.target.hasClass('fetched')) {
                        instance.render(e.target.get('id'), -1);
                    }
                });

                // Set the initial onclick one.
                var modules = this.get('modules');
                tabNode.one('> ul.block-mymodules-new-overview-list > li.yui3-tab > a#' + modules).simulate('click');
            }
        },
        expandable : function(node) {
            var blocks = node.all('.coursebox');
            blocks.each(function(blockNode) {
                if (blockNode.one('.activity_info')) {
                    blockNode.addClass('expandable-processed expandable-open');
                    blockNode.one('.course_title').on('click', function(e) {
                        if (!e.target.hasAttribute('href')) {
                            blockNode.one('.activity_info').toggleView(null, function() {
                                if (this.hasAttribute('hidden')) {
                                    blockNode.replaceClass('expandable-open', 'expandable-closed');
                                } else {
                                    blockNode.replaceClass('expandable-closed', 'expandable-open');
                                }
                            });
                        }
                    });
                    blockNode.one('.course_title').simulate('click');
                }
            });
        },
        render : function(targetid, mynumber) {

            var params = {
                tab : targetid,
                mynumber: mynumber
            };
            var instance = this;

            // Fetch the content to display in the new tab.
            var ajaxfile = '/blocks/new_course_overview/ajax/mymodules.php';
            Y.use('io', function(Y) {
                Y.io(M.cfg.wwwroot + ajaxfile, {
                    method  : 'POST',
                    data    :  build_querystring(params),
                    on      : {
                        complete: function(tid, outcome) {
                            try {
                                var object = Y.JSON.parse(outcome.responseText);
                                if (object.success) {
                                    var content = Y.one('div.nottingham-courselist.' + targetid);
                                    if (content) {
                                        var newNode = Y.Node.create(object.response.content);
                                        content.setHTML(newNode);
                                        instance.expandable(content);
                                    }
                                    //set listener for showing all courses.
                                    content.all('.box.notice a').on('click', function(e) {
                                        e.preventDefault();
                                        instance.render(targetid, -2);
                                    });

                                    var targetTab = Y.one('#'+targetid);
                                    if (!targetTab.hasClass('fetched')) {
                                        targetTab.addClass('fetched');
                                    }
                                }

                                return true;
                            } catch (error) {
                                if (outcome && outcome.status && outcome.status > 0) {
                                    // If we got here then there was an error parsing the result.
                                    Y.log('Error parsing AJAX response', 'error', 'moodle-theme_new_course_overview');
                                    Y.use('moodle-core-notification-exception', function () {
                                        return new M.core.exception(error).show();
                                    });
                                }

                                return false;
                            }
                            return true;
                        }
                    },
                    context : this
                });
            });
            return true;
        }
    }, {
        NAME : MYMODULESNAME,
        ATTRS : {
            base : {
                setter : function(node) {
                    var n = Y.one(node);
                    if (!n) {
                        Y.fail(MYMODULESNAME + ': invalid base node set');
                    }
                    return n;
                }
            },
            modules : {
                value : '',
                validator : Y.Lang.isString
            },
        }
    });
    Y.augment(MYMODULES, Y.EventTarget);

    M.block_new_course_overview = M.block_new_course_overview || {};
    M.block_new_course_overview.mymodules = function(params) {
        new MYMODULES(params);
    }

}, '@VERSION@', {
    requires:['base', 'node', 'tabview', 'json-parse']
});
