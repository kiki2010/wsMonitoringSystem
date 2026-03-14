function showODS(btn, id) {
    document.querySelectorAll('.ods-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.ods-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(id).classList.add('active');
}