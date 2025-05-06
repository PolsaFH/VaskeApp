function toggleNavbar() {
    const navbar = document.querySelector('.navbar');
    const content = document.querySelector('.content');
    
    if (navbar.style.left === '0px') {
      navbar.style.left = '-250px'; // Hide navbar
    } else {
      navbar.style.left = '0px'; // Show navbar
    }
  }
  