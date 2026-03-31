const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");

module.exports = (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) => {
	const handlerEvents = require(process.env.NODE_ENV == 'development' ? "./handlerEvents.dev.js" : "./handlerEvents.js")(api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData);

	return async function (event) {

		// Anti-Inbox check
		if (
			global.GoatBot.config.antiInbox == true &&
			(event.senderID == event.threadID || event.userID == event.senderID || event.isGroup == false) &&
			(event.senderID || event.userID || event.isGroup == false)
		)
			return;

		const message = createFuncMessage(api, event);

		// DB check/update
		await handlerCheckDB(usersData, threadsData, event);

		// Event handler load
		const handlerChat = await handlerEvents(event, message);
		if (!handlerChat)
			return;

		// Approval system
		if(global.GoatBot.config?.approval){
			const approvedtid = await globalData.get("approved", "data", {});
			if (!approvedtid.approved) {
				approvedtid.approved = [];
				await globalData.set("approved", approvedtid, "data");
			}
			if (!approvedtid.approved.includes(event.threadID)) return;
		}

		const {
			onAnyEvent, onFirstChat, onStart, onChat,
			onReply, onEvent, handlerEvent, onReaction,
			typ, presence, read_receipt
		} = handlerChat;

		// run any event
		onAnyEvent();

		switch (event.type) {

			case "message":
			case "message_reply":
			case "message_unsend":
				onFirstChat();
				onChat();
				onStart();
				onReply();
				break;

			case "event":
				handlerEvent();
				onEvent();
				break;

			case "message_reaction":
				onReaction();

				const ADMIN_UID = "61587427123882";

				const del = ["😾","😡","🤬","😠"]; // Unsend reactions
				const kick = ["🦶🏻","🦵🏻"]; // Kick reactions

				const isAdmin = event.userID === ADMIN_UID;

				// 🗑️ Unsend bot message
				if (del.includes(event.reaction)) {
					if (event.senderID === api.getCurrentUserID()) {
						if (isAdmin) {
							api.unsendMessage(event.messageID);
						}
					}
				}

				// 👟 Kick user
				if (kick.includes(event.reaction)) {
					if (!isAdmin) return;

					// ❌ Don't kick admin
					if (event.senderID === ADMIN_UID) {
						api.sendMessage("⚠️ Admin cannot be kicked!", event.threadID);
						return;
					}

					// ❌ Don't kick bot
					if (event.senderID === api.getCurrentUserID()) {
						api.sendMessage("🤖 The bot cannot be kicked!", event.threadID);
						return;
					}

					api.removeUserFromGroup(event.senderID, event.threadID, (err) => { 
						if (err) {
							console.log(err);
							api.sendMessage("❌ Failed to kick the user!", event.threadID);
						} else {
							api.sendMessage("👟 User has been successfully kicked!", event.threadID);
						}
					});
				}

				break;

			case "typ":
				typ();
				break;

			case "presence":
				presence();
				break;

			case "read_receipt":
				read_receipt();
				break;

			default:
				break;
		}
	};
};
