function confirmRemove(id) {
    if (confirm("Are you sure you want to remove this member?")) {
        document.getElementById(id).submit();
    } 
}

function confirmChangeAdmin(id, type) {
    if (type === "remove") {
        if (confirm("Are you sure you want to remove this member as an admin?")) {
            document.getElementById(id).submit();
        } 
    } else if (type === "add") {
        if (confirm("Are you sure you want to add this member as an admin?")) {
            document.getElementById(id).submit();
        } 
    }
}