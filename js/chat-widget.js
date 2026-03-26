/* chat-widget.js — openChat/closeChat */
function openChat() {
  document.getElementById('chatPill').style.display = 'none';
  document.getElementById('chatPanel').classList.add('open');
}
function closeChat() {
  document.getElementById('chatPanel').classList.remove('open');
  document.getElementById('chatPill').style.display = 'flex';
}
