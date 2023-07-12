const express = require("express");


class vk_event {
	constructor(type, object, group_id, event_id, secret) {
		this.type = type
		this.object = object
		this.group_id = group_id
		this.event_id = event_id
		this.secret = secret
	}
}


class group {
	constructor(id, return_str, secret_key) {
		this.id = id;
		this.return_str = return_str;
		this.secret_key = secret_key;
	}
}


function getUrl(host, port, ssl_protected = false) {
	if (ssl_protected == true) {
		if (port == 443) {
			return `https://${host}`;
		}
		else return `https://${host}:${port}`;
	}
	else {
		if (port == 80) {
			return `http://${host}`;
		}
		else return `http://${host}:${port}`;
	}
}


class VkEvent_handler {
	constructor (eventFunction, check = () => {}) {
		this.eventFunction = eventFunction;
		this.check = check;
	}
}


defaultHandler = new VkEvent_handler((group_obj, Event) => {
	console.log('Needs code\n==========');
	console.log(`Group: ${group_obj.id}, Event:\ntype: ${Event.type}\ngroup_id: ${Event.group_id}\nevent_id: ${Event.event_id}\nsecret: ${Event.secret}\nobject:`, Event.object);
}, () => console.log('[WARNING] You not connect vk event handler: VkEvent_handler'));


class server {
	constructor(groups = [], _event = defaultHandler, host='localhost', port = 80, logger=false) {
		this.host = host;
		this.port = port;
		this.groups = groups;
		this.logger = Boolean(logger);
		_event.check();
		this._event = _event.eventFunction;

		this.group_dict = new Object();

		for (var index = 0; index < this.groups.length; ++index) {
			var item = this.groups[index];
			this.group_dict[item.id] = item;
		}
	}
	
	log (event) {
		if (this.logger) console.log(event);
	}

	confirmation_secret (group_obj, Event, getTimeConfiramtor = (group_obj, Event) => true) {
		// console.log(123);
		if (Event.secret != group_obj.secret_key) {
			return "<strong>Invalid secret key</strong>";
		}
		else if (Event.type == 'confirmation') {
			return group_obj.return_str;
		}
		else {
			if (
				!getTimeConfiramtor(group_obj, Event)
			) {
				// console.log(123);
				return "<b>Request timeouted</b>";
			}
			else {
				setTimeout(async () => this._event(group_obj, Event), 10);
				return 'ok';
			}
		}
	}

	start(callback = () => {}, print_serverInfo = console.log) {
		let app = express();
		app.use(express.json());

		app.route('/:group_id').post(
			async (req, res) => {
				try {
					var group_id = Number(req.params.group_id);
					group_id = String(group_id);
					var POST_DATA = req.body;
					if (this.group_dict[group_id] !== undefined) {
						var callback_event = new vk_event(
							POST_DATA.type,
							POST_DATA.object,
							POST_DATA.group_id,
							POST_DATA.event_id,
							POST_DATA.secret
						);
						this.log(callback_event);
						res.send(this.confirmation_secret(this.group_dict[group_id], callback_event));
					}
					else {
						res.send('group_id failed');
					}
				}
				catch (err) {
					console.log(`Raised error: ${err.message}\n======================\n${err.stack}`);
					res.status(500).send(`<b>Raised error: ${err.message}</b><br/>\n${err.stack}`);
				}
			}
		).get(async (req, res) => { res.send('<strong>Invalid secret key</strong>') });

		app.listen(this.port, this.host, (err) => {
			if (err) {
				throw err;
			}
			else {
				print_serverInfo(`vk callback server listen in ${getUrl(this.host, this.port)}`);
				callback();
			}
		});
		
		this.server = app;
	}
}


module.exports = {
	VkEvent: vk_event,
	Group: group,
	Server: server,
	VkEventHandler: VkEvent_handler
};