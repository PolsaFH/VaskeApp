function confirmRemove(id) {
    if (confirm("Are you sure you want to remove this member?")) {
        document.getElementById(id).submit();
    } 
}