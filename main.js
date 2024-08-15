import Peer from "peerjs";
import $ from "jquery";

let peer = null;
let connections = [];
let nickname = null;

function init() {
  peer = new Peer();
  peer.on("open", function (id) {
    $("#your-id").text(id);
    $("#status").html("Your ID is generated. Waiting for connection...");
  });

  peer.on("connection", function (conn) {
    handleConnection(conn);
  });

  peer.on("disconnected", function () {
    $("#status").html("Connection lost. Please reconnect.");
    peer.reconnect();
  });

  peer.on("close", function () {
    $("#status").html("Connection destroyed.");
  });

  peer.on("error", function (err) {
    alert(err);
  });
}

function connectToPeer() {
  const peerId = $("#input-peer-id").val();
  nickname = $("#nickname").val();

  if (!peerId || !nickname) {
    alert("Please enter a peer ID and your nickname.");
    return;
  }

  const conn = peer.connect(peerId);
  conn.on("open", function () {
    $("#status").html("Connected to: " + conn.peer);
    handleConnection(conn);
  });
}

function handleConnection(conn) {
  connections.push(conn);

  conn.on("data", function (data) {
    const { msg, name, senderId } = JSON.parse(data);

    // 메시지를 화면에 추가
    addMessage(msg, "right", name);

    // 메시지를 다시 전달하지만 원래 보낸 피어에게는 전송하지 않음
    connections.forEach((c) => {
      if (c.peer !== senderId) {
        c.send(JSON.stringify({ msg, name, senderId: peer.id }));
      }
    });
  });

  conn.on("close", function () {
    $("#status").html(`Connection with ${conn.peer} closed.`);
    connections = connections.filter((c) => c !== conn);
  });

  ready();
}

function ready() {
  // 메시지 보내기 이벤트 처리
  $("#sendMessageBox")
    .off("keydown")
    .on("keydown", function (key) {
      if (key.keyCode === 13 && connections.length > 0) {
        const msg = $("#sendMessageBox").val();
        if (msg.trim() !== "") {
          $("#sendMessageBox").val("");

          // 자신의 메시지를 모든 연결된 피어들에게 전송
          const data = JSON.stringify({
            msg,
            name: nickname,
            senderId: peer.id,
          });
          connections.forEach((conn) => conn.send(data));

          // 자신의 메시지를 화면에 추가
          addMessage(msg, "left", nickname);
        }
      }
    });
}

function addMessage(msg, side, senderName) {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");

  const msgHtml = [];
  msgHtml.push(`<li class="chat-${side}">`);
  msgHtml.push(
    '<div class="chat-hour">' +
      h +
      ":" +
      m +
      ":" +
      s +
      '<span class="fa fa-check-circle"></span></div>'
  );
  msgHtml.push('<div class="chat-text">' + msg + "</div>");
  msgHtml.push('<div class="chat-avatar">');
  msgHtml.push(
    '<img src="https://www.bootdey.com/img/Content/avatar/avatar' +
      (side === "left" ? "4" : "3") +
      '.png" alt="User Avatar"/>'
  );
  msgHtml.push('<div class="chat-name">' + senderName + "</div>");
  msgHtml.push("</div></li>");

  $("#chat_box").append(msgHtml.join(""));
}

$(document).ready(function () {
  init();

  $("#connect-button").click(function () {
    connectToPeer();
  });
});
