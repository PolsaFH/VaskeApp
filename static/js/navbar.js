function toggleNavbar() {
    const navbar = document.querySelector('.navbar');
    const content = document.querySelector('.content');
    
    if (navbar.style.left === '0px') {
      navbar.style.left = '-250px'; // Hide navbar
      content.classList.remove('shifted'); // Move content back
    } else {
      navbar.style.left = '0px'; // Show navbar
      content.classList.add('shifted'); // Shift content to the right
    }
  }
  