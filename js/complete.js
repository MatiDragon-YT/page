//$('head').append("<!-- Google Tag Manager -->");
//$('nav').addClass('k');
//$("nav").attr('role','navigation');
$('body').prepend(`
 <!--START NAV-->
   <nav class="bg-dark">
    <div class="nav-wrapper">
     <a id="logo-container" href="https://matidragon.000webhostapp.com/es/index.html" class="brand-logo pl-md-3">MatiDragon</a>
     <ul class="right hide-on-med-and-down"><b>
      <li><a href="https://matidragon.000webhostapp.com/es/index.html">Inicio</a></li>
      <li><a href="https://matidragon.000webhostapp.com/es/articles/index.html">Articulos</a></li>
      <li><a href="https://matidragon.000webhostapp.com/es/builds/index.html">Construcciones</a></li>
     </b></ul>
     <ul id="nav-mobile" class="sidenav">
      <li><a href="https://matidragon.000webhostapp.com/es/index.html"><i class="material-icons">home</i>Inicio</a></li>
      <li><a href="https://matidragon.000webhostapp.com/es/articles/index.html"><i class="material-icons">articles</i>Articulos</a></li>
      <li><a href="https://matidragon.000webhostapp.com/es/builds/index.html"><i class="material-icons">build</i>Construcciones</a></li>
     </ul>
     <a href="#" data-target="nav-mobile" class="top-nav sidenav-trigger waves-effect waves-light circle hide-on-large-only"><i class="material-icons">menu</i></a>
    </div>
   </nav>
 <!--END NAV & START MAIN-->
`);
$('#widgets').prepend(`
      <div class="row">
       <div class="col-12">
        <h5 class="bg-dark p-2 text-white">Buscardor</h5>
        <script async src='https://cse.google.com/cse.js?cx=partner-pub-4341855334026116:6457574907'></script>
        <div class="gcse-search"></div>
       </div>
       <div class="col-6 col-lg-12">
        <h5 class="bg-dark p-2 mb-4 text-white">Recomendado</h5>
        <script src="https://apis.google.com/js/platform.js"></script>
        <div class="g-ytsubscribe" data-channelid="UCIqJ7P_fLvULqvmsDagJBjA" data-layout="full" data-count="default"></div>
        <div class="g-ytsubscribe" data-channelid="UCjdAhuuNErEusMj_ea_cENg" data-layout="full" data-count="default"></div>
       </div>
       <div class="col-6 col-lg-12">
        <h5 class="bg-dark p-2 text-white">Noticia</h5>
        <div class="inf center">
          <h6>YA TENEMOS DISCORD</h6>
          <a class="tooltipped" data-position="bottom" data-tooltip="No te arrepentiras ;)" href="https://discord.gg/GBkEqSE2jY">entra haciendo click aquí.</a>
        </div>
       </div>
      </div>
`);
$('body').append(`
 <!--END MAIN & START FOOTER-->
 <footer class="bg-dark page-footer docs-footer">
  <div class="container-fluid">
   <div class="row">
    <div class="col-12 col-md-6 col-lg-6 col-xl-8">
     <h4>Que es este lugar?</h4>
     <h5>Bueno...</h5>
     <p>Actualmente este es un sitio de alojamiento de modificaciones para el grandiso Grand Theft Auto: San Andreas.<br>Deseando mayor entretenimiento y divercion, respetando lo mejor que se puedan, los derechos de autor.</p>
    </div>
    <div class="col-6 col-sm-6 col-md-3 col-lg-3 col-xl-2">
     <h5>Direcciones</h5>
     <a href="https://www.gtainside.com/user/MatiDragon" target="_black">GTAinside</a><br>
     <a href="https://www.instagram.com/matidragon_x2/" target="_black">Instagram</a><br>
     <a href="https://www.youtube.com/channel/UCIqJ7P_fLvULqvmsDagJBjA" target="_black">YouTube</a><br>
     <!--<a href="http://bit.ly/32NPwsU" target="_black">MDForos</a><br>-->
    </div>
    <div class="col-6 col-sm-6 col-md-3 col-lg-3 col-xl-2">
     <h5>Frameworks</h5>
     <a href="https://getbootstrap.com" target="_black" title="CSS">Bootstrap 4</a><br>
     <a href="https://materializecss.com/" target="_black" title="CSS">Materialize CSS</a><br>
     <a href="https://jquery.com" target="_black" title="JS">JQuery</a><br>
    </div>
   </div>
   <div class="divider"></div>
   <div class="footer-copyright">
    <div class="container-fluid center">
     <p><span class="float-md-left">© 2018-<span id="copy">2020</span> MatiDragon, All rights reserved.</span>
     <a href="https://matidragon.000webhostapp.com/es/LICENSE" class="grey-text float-md-right">License CC BY-NC-ND Digital Code</a></p>
    </div>
   </div>
   <div class="p-1"></div>
  </footer>
 <!--END FOOTER-->
`);

let copy=(new Date).getFullYear();
$(document).ready(function(){
 $("#copy").text(copy)
});