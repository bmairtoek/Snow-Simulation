/**
 *
 * Snow Box by Felix Turner
 * www.airtight.cc
 *
 * Three.js particles moving via perlin noise
 *
 */
var boxW, boxH, boxD;
var platW, platH, platD, snowH, snowAlpha = 0, snowPatch;
var noiseScale = 114;
var container, camera, scene, renderer, stats;
var particleSystem, particleGeometry;
var particles = [];
var perlin;
var mouse2D;
var windDir = 0;
var params;
var gui;
var box;
var snowMapSide, snowTextureSide, snowTexturePlane;

if(!Detector.webgl)
	Detector.addGetWebGLMessage({});

function ParticleParms() {
	this.particleCount = 2000;
	this.particleSize = 10;
	this.windSpeed = 1.5;
	this.gravity = 2;
	this.particleLifeSpan = 400;
	this.cameraZ = 600;
}

function init() {
	params = new ParticleParms();
	//create control panel
	gui = new DAT.GUI();

	// Add Sliders with min + max
	gui.add(params, 'particleCount', 500, 40000, 100).name('Gęstość śniegu').onChange(initParticles);
	gui.add(params, 'particleSize', 1, 20, 1).name('Wielkość śnieżynek');
	gui.add(params, 'gravity', 0.1, 10, .1).name('Prędkość wiatru');
	gui.add(params, 'particleLifeSpan', 20, 2000, 20).name('Czas życia śnieżynki');


	$(".guidat-controllers").css("height", "126px");
	// stop the user getting a text cursor
	document.onselectStart = function() {
		return false;
	};
	//set up 3D renderer
	container = document.createElement('div');
	document.body.appendChild(container);
	renderer = new THREE.WebGLRenderer({
		antialias : true,
		alpha: true,
		clearAlpha : 1,
		sortObjects : false,
		sortElements : false
	});

	renderer.setClearColorHex(0xeeeeee);

	renderer.setSize(window.innerWidth, window.innerHeight);
	container.appendChild(renderer.domElement);
	camera = new THREE.Camera(40, window.innerWidth / window.innerHeight, 1, 10000);
	camera.position.z = 550;
	scene = new THREE.Scene();
	boxW = window.innerWidth / 2 * 6;
	boxH = window.innerHeight / 2 * 6;
	boxD = boxW;

	
	addSkybox(scene, boxW, boxH, boxD);
	
	platW = boxW/10;
	platH = boxH/100;
	platD = boxD/10;
	var platformMapSide = THREE.ImageUtils.loadTexture('textures/floor-wood.jpg');
	var platformMapPlane = THREE.ImageUtils.loadTexture('textures/floor-wood.jpg');
	var platformTextureSide = new THREE.MeshLambertMaterial({map:platformMapSide});
	var platformTexturePlane = new THREE.MeshLambertMaterial({map:platformMapPlane});
	var materials = [
		platformTextureSide,
		platformTextureSide,
		platformTexturePlane,
		platformTexturePlane,
		platformTextureSide,
		platformTextureSide
	];
	var platform = new THREE.Mesh(new THREE.CubeGeometry(platW, platH, platD, 1, 1, 1, materials), new THREE.MeshFaceMaterial());
	platformMapSide.wrapS = THREE.RepeatWrapping;
	platformMapSide.wrapT = THREE.RepeatWrapping;
	platform.geometry.computeBoundingBox();
	platformMapSide.repeat.set(platW/platW , platH/platW);
    platformMapSide.needsUpdate = true;
	
	var legMap = THREE.ImageUtils.loadTexture('textures/floor-wood.jpg');
	var platformLeg = new THREE.Mesh(new THREE.CylinderGeometry(60,boxW/300,boxW/300,boxH/2), new THREE.MeshLambertMaterial({
        map: legMap
	}));
	legMap.wrapS = THREE.RepeatWrapping;
	legMap.wrapT = THREE.RepeatWrapping;
	platformLeg.geometry.computeBoundingBox();
	legMap.repeat.set(1 / 4 , 4);
    legMap.needsUpdate = true;
	
	platformLeg.position.y = -boxH/4;
	platformLeg.rotation.x = -Math.PI / 2;
	platformLeg.rotation.z = Math.PI;
	scene.addObject(platform);
	scene.addObject(platformLeg);

	snowMapSide = THREE.ImageUtils.loadTexture('textures/snow.jpg');
	var snowMapPlane = THREE.ImageUtils.loadTexture('textures/snow.jpg');
	 snowTextureSide = new THREE.MeshPhongMaterial({map:snowMapSide,shininess:20,specular:0x111111});
	 snowTexturePlane = new THREE.MeshPhongMaterial({map:snowMapPlane,shininess:20,specular:0x111111});
	var snowMaterials = [
		snowTextureSide,
		snowTextureSide,
		snowTexturePlane,
		snowTexturePlane,
		snowTextureSide,
		snowTextureSide
	];
	snowH = 0.1;
	snowPatch = new THREE.Mesh(new THREE.CubeGeometry(platW, snowH, platD, 1, 1, 1, snowMaterials), new THREE.MeshFaceMaterial());
	snowMapSide.wrapS = THREE.MirroredRepeatWrapping;
	snowMapSide.wrapT = THREE.MirroredRepeatWrapping;
	snowPatch.geometry.computeBoundingBox();
	snowMapSide.repeat.set(platW/platW , snowH/platW);
    snowMapSide.needsUpdate = true;
	
	snowPatch.position.y=platH/2+snowH/2;
    scene.addObject(snowPatch);
	snowPatch.rotation.x = Math.PI;
	snowPatch.materials[0].transparent = true;
	
	var ambiLight = new THREE.AmbientLight(0xaaaaaa);
    scene.addObject(ambiLight);
	
    var directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(-40, 70, 70);
	scene.addObject(directionalLight);
	directionalLight.target = snowPatch;
	
	var directionalLight2 = new THREE.DirectionalLight(0x111111);
    directionalLight2.position.set(40, -70, -70);
	scene.addObject(directionalLight2);
	directionalLight2.target = snowPatch;
	
	perlin = new ImprovedNoise();

	//create one shared particle material
	var sprite = THREE.ImageUtils.loadTexture("img/snowflake.png");
	material = new THREE.ParticleBasicMaterial({
		size : params.particleSize,
		map : sprite,
		blending : THREE.AdditiveBlending,
		depthTest : true,
		transparent : true,
		vertexColors : true, //allows 1 color per particle,
		//opacity : .7
	});
	mouse2D = new THREE.Vector2(0, 0);

	//add stats
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild(stats.domElement);
	
	initParticles();
	animate();
}

function initParticles() {

	if(particleSystem)
		scene.removeObject(particleSystem);
	particles = [];
	particleGeometry = new THREE.Geometry();

	//init particle system
	particleSystem = new THREE.ParticleSystem(particleGeometry, material);
	particleSystem.sortParticles = false;
	scene.addObject(particleSystem);

	for( i = 0; i < params.particleCount; i++) {
		var p = new Particle(i / params.particleCount);
		particles.push(p);
	}
}

function animate() {
	requestAnimationFrame(animate);

	stats.update();

	camera.position.x += (mouse2D.x * 1.5 - camera.position.x) * 0.3;
	camera.position.y += (-mouse2D.y * 1.5 - camera.position.y) * 0.3;
	windDir += .005;

	//loop thru each particle
	for( i = 0; i < params.particleCount; i++) {
		particles[i].update();
	}
	var skala = params.gravity*params.particleCount*params.particleSize/300000;
	if (snowAlpha<1){
		snowAlpha+=0.001*skala;
		snowTextureSide.opacity = snowAlpha;
		snowTexturePlane.opacity = snowAlpha;
	} else {
		snowH+=0.001*skala;
		snowPatch.scale.y+=0.01*skala;
		snowPatch.position.y+=0.0005*skala;
		snowMapSide.repeat.set(1, snowH/platW);
	}
	
	params.windSpeed = params.gravity*3/4;
	particleGeometry.__dirtyVertices = true;
	particleGeometry.__dirtyColors = true;

	
	material.size = params.particleSize;
	camera.position.z = params.cameraZ;

	renderer.render(scene, camera);
}


$(window).mousemove(function(event) {
	//set cam X,Y position
	mouse2D.x = event.clientX - window.innerWidth / 2;
	mouse2D.y = event.clientY - window.innerHeight / 2;
});

$(window).mousewheel(function(event, delta) {
	//set camera Z
	params.cameraZ -= delta * 50;
	//limit
	params.cameraZ = Math.min(2000, params.cameraZ);
	params.cameraZ = Math.max(0, params.cameraZ);
});

$(window).resize(function() {
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
});

$(document).ready(function() {
	init();
});

/**
 * Particle Class handles movement of particles
 */
var Particle = function(id) {

	this.lifeSpan = 200;
	this.id = id;
	this.posn = new THREE.Vector3();
	this.screenPosn = new THREE.Vector3();
	particleGeometry.vertices.push(new THREE.Vertex(this.screenPosn));
	this.color = new THREE.Color();
	particleGeometry.colors.push(this.color);

	this.init = function() {
		//set random posn
		this.screenPosn.set(getRand(-boxW / 2, boxW / 2), getRand(-boxH / 2, boxH / 2), getRand(-boxD / 2, boxD / 2));

		this.posn.x = this.screenPosn.x + boxW / 2;
		this.posn.y = this.screenPosn.y + boxH / 2;

		//get color from Y posn
		var col = map(this.screenPosn.y, -boxH / 2, boxH / 2, 0, 1);
		this.color.setHSV(col, 0, 1);
		this.speed = getRand(params.windSpeed / 3, params.windSpeed);
		this.age = 0;
		this.lifespan = Math.random() * params.particleLifeSpan;
	}
	this.update = function() {

		this.id += 0.01;
		this.direction = perlin.noise(this.id/10, this.posn.x / noiseScale, this.posn.y / noiseScale);
		this.direction += windDir;

		this.posn.x += Math.cos(this.direction) * this.speed;
		this.posn.y += Math.sin(this.direction) * this.speed;
		//gravity
		this.posn.y -= params.gravity;

		if(this.posn.x < 0 || this.posn.y < 0) {
			this.init();
		}

		this.age++;
		if(this.age >= this.lifespan) {
			this.init();
		}
		
		//condition for colision with platform
		if(Math.abs(this.screenPosn.x) < platW/2 && Math.abs(this.screenPosn.y) < platH/2 && Math.abs(this.screenPosn.z) < platD/2) {
			this.init();
		}

		this.screenPosn.x = this.posn.x - boxW / 2;
		this.screenPosn.y = this.posn.y - boxH / 2;

	}

	this.init();
}

function getRand(minVal, maxVal, round) {
	var r = minVal + (Math.random() * (maxVal - minVal));
	if(round) {
		r = Math.round(r);
	}
	return r;

}

function map(value, istart, istop, ostart, ostop) {
	return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
}