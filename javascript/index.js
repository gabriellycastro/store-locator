const StoreLocator = () => {
    const stateSelect = $('.gc-form__select #state');
    const citySelect = $('.gc-form__select #city');

    const loadStoreBanner = (condition) => {
        if (condition == true) {
            $('.gc-map--loaded').removeClass('gc-active');
            $('.gc-map--unloaded').addClass('gc-active');
        } else {
            $('.gc-map--loaded').addClass('gc-active');
            $('.gc-map--unloaded').removeClass('gc-active');
        }
    }

    const markerClick = (marker) => {
        removeClearButton();

        let markerName = marker[0].ariaLabel.toUpperCase();

        $('.gc-store').addClass('x-hide');

        $('.gc-store').each(function() {
            if ($(this).attr('title') == markerName) {
                $(this).removeClass('x-hide');

                let clearBtn = `<div class="aside__result--clear">
                <span>Limpar</span>
                </div>`

                $('.gc-aside__result--found').prepend(clearBtn);
            }
        });
    }

    const removeClearButton = () => {
      if ($('.gc-aside__result--clear').length) {
        $('.gc-aside__result--clear').remove();
      }
    }

    const resetFilters = () => {
        $('#state option:first-child').attr('selected', 'selected');
        $('#city option:first-child').attr('selected', 'selected');
        $('.gc-aside__result--found .store').addClass('x-hide');

        $('#find-by-location').removeClass('gc-active');
    }

    const getStores = (map, markers) => {
        $.ajax({
            url: `/api/dataentities/SL/search?_sort=nome ASC&_fields=nome,endereco,complemento,bairro,municipio,estado,estado_siga,cep,ddd_telefone,numero_telefone,horario_seg_sab,horario_dom,latitude,longitude&an=mrcatstore`,
            headers: {
                'REST-Range': 'resources=0-1000'
            },
        }).then(stores => {
            let bounds = new google.maps.LatLngBounds();
            stores.map(function (data, index) {

                let marker = new google.maps.Marker({
                    position: new google.maps.LatLng(parseFloat(data.latitude), parseFloat(data.longitude)),
                    map: map,
                    title: data.nome.toUpperCase(),
                    icon: '/arquivos/maps-marker-duck.png',
                });
                bounds.extend(new google.maps.LatLng(marker.position.lat(), marker.position.lng()));

                markers.push(marker);

                let weeklyTime,
                    weekendTime;

                data.horario_seg_sab != null && data.horario_seg_sab != undefined ? weeklyTime = `segunda a sábado - ${data.horario_seg_sab}` : weeklyTime = '';

                data.horario_dom != null && data.horario_dom != undefined ? weekendTime = `</br>domingo - ${data.horario_dom}` : weekendTime = '';


                $('.gc-aside__result--found').append(
                    `
                    <div class="store" title="${data.nome.toUpperCase()}" data-lat="${parseFloat(data.latitude)}" data-lng="${parseFloat(data.longitude)}" data-estado="${data.estado}">
                    <h3 class="store__name">${data.nome.toLowerCase()}</h3>
                    <p class="store__adress">${data.endereco} - ${data.complemento} - ${data.bairro} - <span>${data.municipio}</span>/${data.estado} - ${data.cep}</p>
                    <p class="store__phone"><a href="tel:+55${data.ddd_telefone}${data.numero_telefone}">(${data.ddd_telefone})${data.numero_telefone}</a></p>
                    <p class="store__time">${weeklyTime}${weekendTime}</p>
                    </div>
                    `
                )
            });

            map.fitBounds(bounds);
            map.panToBounds(bounds);
        })
    }

    const updateMap = (map) => {
        
        let markers = window.OurStoresMarkers;
        let myLocation = window.MyLocationMarker;

        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }

        for (var i = 0; i < myLocation.length; i++) {
          myLocation[i].setMap(null);
        }

        markers = [];
        myLocation = [];

        let bounds = new google.maps.LatLngBounds();

        $(`.aside__result--found .store`).each(function () {
            if (!$(this).hasClass('x-hide')) {
                let marker = new google.maps.Marker({
                    position: new google.maps.LatLng(parseFloat($(this).data('lat')), parseFloat($(this).data('lng'))),
                    map: map,
                    title: $(this).find('h3').text().toUpperCase(),
                    icon: '/arquivos/maps-marker-duck.png',
                });

                bounds.extend(new google.maps.LatLng(marker.position.lat(), marker.position.lng()));

                markers.push(marker);
            }
        });

        map.fitBounds(bounds);
        map.panToBounds(bounds);

        window.OurStoresMarkers = markers;
    }

    const findStore = () => {
      if ($('.gc-store:not(.x-hide)').length == 0) {
          $('.gc-aside__result--not-found').removeClass('x-hide');
          $('.gc-map--loaded').removeClass('gc-active');
          $('.gc-map--unloaded').addClass('gc-active');
      } else {
          $('.gc-aside__result--not-found').addClass('x-hide');
          $('.gc-map--loaded').addClass('gc-active');
          $('.gc-map--unloaded').removeClass('gc-active');
      }
    }

    const filterByState = (map) => {
        let idUf = stateSelect.children('option:selected').attr('iduf');
        let uf = stateSelect.children('option:selected').attr('value');

        citySelect
            .find('option[disabled!="disabled"]')
            .remove()
            .end();

        $.get('http://servicodados.ibge.gov.br/api/v1/localidades/estados/' + idUf + '/municipios', function (data) {
            $.each(data, function (i, city) {
                citySelect.append("<option id='" + city.id + "'>" + city.nome + '</option>');
            });
        });

        $('#city option:first-child').attr('selected', 'selected');

        $(`.store[data-estado!="${uf}"]`).addClass('x-hide');
        $(`.store[data-estado="${uf}"]`).removeClass('x-hide');

        $(`.store[data-estado="${uf}"] p span`).each(function () {
            $(this).parent().parent().attr(
                'data-cidade',
                $(this)
                    .text()
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/ /g, '-')
            );
        });

        findStore();
        updateMap(map);
    }

    const filterByCity = (map) => {
        let city = citySelect
            .children('option:selected')
            .text()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/ /g, '-');

        $(`.store[data-cidade!="${city}"]`).addClass('x-hide');

        $(`.store[data-cidade="${city}"]`).removeClass('x-hide');

        findStore();
        updateMap(map);
    }

    const filterByTyping = (inputValue, map) => {

        $('.gc-store').each(function() {
            let storeName = $(this).children('h3').text().toUpperCase();
            let storeAdress = $(this).children('.gc-store__adress').text().toUpperCase();

            if (
              storeName.indexOf(inputValue.toUpperCase()) >= 0
              || storeAdress.indexOf(inputValue.toUpperCase()) >= 0
            ) {
                $(this).removeClass('x-hide');
            }
        });

        findStore();
        updateMap(map);
    }

    const findByLocation = (radiusValue, map) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {

            // set map position and show stores based on user location
            let pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            let storesNext = [];

            $('.gc-aside__result--found .store').each(function () {
              let store = $(this);
              let storeLat = store.attr('data-lat');
              let storeLng = store.attr('data-lng');

              let dist = distLatLong(pos.lat, pos.lng, parseFloat(storeLat), parseFloat(storeLng));

              if (dist < radiusValue) {
                  storesNext.push(store);

                  for (var i = 0; i < storesNext.length; i++) {
                      $('.gc-store .store__name').each(function () {
                          if ($(this).text() == storesNext[i].children('h3').text()) {
                          $(this).parent().removeClass('x-hide');

                          updateMap(map);
                          }
                      });
                  }
              } 
              
              findStore();
            });

            // set radius circle and user location marker
            let marker = new google.maps.Marker({
              position: new google.maps.LatLng(pos.lat, pos.lng),
              map: map,
              title: "Você está aqui",
              icon: '/arquivos/person-location.png',
              center: new google.maps.LatLng(pos.lat, pos.lng),
            });

            let locationRadius = new google.maps.Circle({
                strokeColor: "#FFCE44",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#FFCE44",
                fillOpacity: 0.35,
                map,
                center: new google.maps.LatLng(pos.lat, pos.lng),
                radius: radiusValue * 1000,
            });

            locationRadius.bindTo('marker', marker);
            myLocation.push(marker, locationRadius);

            window.MyLocationMarker = myLocation;
        },
        function (error) {
            Swal.fire({
                text: 'Ative sua localização e recarregue a página para encontrar a loja mais próxima',
                confirmButtonColor: '#000000',
                footer: '<i class="swal-mrcat-ico"></i>'
            });
        });
      }
    }

    const distLatLong = (lat1, lon1, lat2, lon2) => {
        function toRad(graus) {
          return graus * (Math.PI / 180)
        }
  
        var R = 6371;
        var Lati = Math.PI / 180 * (lat2 - lat1);
        var Long = Math.PI / 180 * (lon2 - lon1);
        var a = Math.sin(Lati / 2) * Math.sin(Lati / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(Long / 2) * Math.sin(Long / 2);
  
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = Math.round(R * c); // distance in kilometers
        return d;
    }

    const mapStyle = [
        {
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#f5f5f5"
            }
          ]
        },
        {
          "elementType": "labels.icon",
          "stylers": [
            {
              "visibility": "off"
            }
          ]
        },
        {
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#616161"
            }
          ]
        },
        {
          "elementType": "labels.text.stroke",
          "stylers": [
            {
              "color": "#f5f5f5"
            }
          ]
        },
        {
          "featureType": "administrative.land_parcel",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#bdbdbd"
            }
          ]
        },
        {
          "featureType": "poi",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#eeeeee"
            }
          ]
        },
        {
          "featureType": "poi",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#757575"
            }
          ]
        },
        {
          "featureType": "poi.park",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#e5e5e5"
            }
          ]
        },
        {
          "featureType": "poi.park",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#9e9e9e"
            }
          ]
        },
        {
          "featureType": "road",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#ffffff"
            }
          ]
        },
        {
          "featureType": "road.arterial",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#757575"
            }
          ]
        },
        {
          "featureType": "road.highway",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#dadada"
            }
          ]
        },
        {
          "featureType": "road.highway",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#616161"
            }
          ]
        },
        {
          "featureType": "road.local",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#9e9e9e"
            }
          ]
        },
        {
          "featureType": "transit.line",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#e5e5e5"
            }
          ]
        },
        {
          "featureType": "transit.station",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#eeeeee"
            }
          ]
        },
        {
          "featureType": "water",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#c9c9c9"
            }
          ]
        },
        {
          "featureType": "water",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#9e9e9e"
            }
          ]
        }
    ]

    var markers = [];
    var myLocation = [];

    $(document).ready(function () {

        let radiusValue = 10; // (set location radius value in km)

        let mapProp = {
            center: new google.maps.LatLng(-16.000809, -50.830384),
            zoom: 4,
            styles: mapStyle,
        };

        let map = new google.maps.Map(document.querySelector('.gc-store-locator .map--loaded'), mapProp);

        getStores(map, markers);
        loadStoreBanner(true);

        window.OurStoresMarkers = markers;
        window.MyLocationMarker = myLocation;

        // filter stores by state
        stateSelect.on('change', function () {

            $('#find-by-typing').val('');
            $('#find-by-location').removeClass('gc-active');

            filterByState(map);
            removeClearButton();
        });

        // filter stores by city
        citySelect.on('change', function () {
            filterByCity(map);
        });

        // filter stores by typing
        $('#find-by-typing').keyup(function(){

          loadStoreBanner(true);
          resetFilters();
          removeClearButton();

          let value = $(this).val(); 

          if (value.length >= 4) {
              filterByTyping(value, map);
          } else {
              $('.gc-store').removeClass('x-hide');
              $('.gc-aside__result--not-found').addClass('x-hide');
          }
        });

        $('#find-by-typing').keydown(function(e){
          if (e.keyCode == 13) {
            e.preventDefault();
          }
        });

        // click on store and show in the map
        $(document).on('click', '.gc-aside__result--found .store', function () {
            loadStoreBanner(false);

            let store_lat = $(this).data('lat'),
                store_lng = $(this).data('lng');

            map.setCenter({ lat: parseFloat(store_lat), lng: parseFloat(store_lng) });
            map.setZoom(16);
        });

        // find stores by location
        $(document).on('click', '#find-by-location', function () {
            $('#find-by-typing').val('');

            resetFilters();
            removeClearButton();
            findByLocation(radiusValue, map);

            $(this).addClass('gc-active');
        });

        // click on marker and show store info
        $(document).on('click', '.gc-map--loaded div[role="img"]', function() {
            if ($(this).attr('aria-label') != 'Você está aqui') {
              markerClick($(this));
            }
        });

        // click on clear button and go back to filter set before
        $(document).on('click', '.gc-aside__result--clear span', function() {
            removeClearButton();

            let typingActive = $('#find-by-typing').val() != '';
            let stateActive = $('#state option:selected').val() != 'estado';
            let cityActive = $('#city option:selected').val() != 'cidade';
            let locationActive = $('#find-by-location').hasClass('gc-active');

            if (typingActive) {
              filterByTyping($('#find-by-typing').val(), map);

            } else if (stateActive) {

              if (cityActive) {
                filterByCity(map);
              } else {
                filterByState(map);
              }

            } else if (locationActive) {

              findByLocation(radiusValue, map);

            } else {

              $('.gc-store').removeClass('x-hide');

              findStore();
              updateMap(map);
              loadStoreBanner(true);
            }
        });
    });
}

StoreLocator();