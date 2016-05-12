/*
    Copyright (c) 2016 eyeOS

    This file is part of Open365.

    Open365 is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

define([

],
	function () {
		'use strict';

        var eyeosBusClient = function (sockjs, stomp) {
            this.sockjs = sockjs;
            this.stomp = stomp;
        };
        var EYEOS_HEADING = 'eyeos.';
        var SYSTEM_GROUP_HEADING = EYEOS_HEADING + 'systemgroup.';

        /**
         * get Topic names from an array of permissions.
         * Topic names are obtained from permissions that are groupnames:
         *  eyeos.systemgroup.XYZ => systemgroup.XYZ
         *
         * @param permissions array
         * @return {Array} of topics that correspond to groups in permissions array.
         */
        eyeosBusClient.prototype.getGroupTopics = function getGroupTopics(permissions) {
            if (! permissions || ! Array.isArray(permissions)) {
                return [];
            }
            var groups = permissions.filter(function(permission){return permission.indexOf(SYSTEM_GROUP_HEADING) === 0;});
            var topics = groups.map(function(permission){return permission.substring(EYEOS_HEADING.length)})
            return topics;
        };

        eyeosBusClient.prototype.start = function (card, signature, messageCallback, connectCallback) {
            this.ws = new this.sockjs('/stomp');
            var client = this.stomp.over(this.ws);

            client.heartbeat.outgoing = 0;
            client.heartbeat.incoming = 0;

            function callMessageCallback(d) {
                messageCallback(d.body);
            }

            var minicard = localStorage.minicard;
            var minisignature = localStorage.minisignature;

            var self = this;
            client.connect(
                minicard, minisignature,
                function() {
                    var queue_name = "user_" + card.username + '@' + card.domain;
                    client.subscribe("/exchange/" + queue_name + "/#", callMessageCallback);

                    if (typeof connectCallback === "function") {
                        connectCallback();
                    }
                },
                function(e) {
                    console.log('Error connecting to stomp server:', e);
                    client.disconnect(function () {
                        setTimeout(function() {
                            console.log('Reattempting Connection...');
                            self.start(card, signature, messageCallback, connectCallback);
                        }, 2000);
                    });
                },
                '/');
        };

        return eyeosBusClient;

	}
);
