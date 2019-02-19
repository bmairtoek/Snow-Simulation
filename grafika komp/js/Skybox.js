function addSkybox(scene, boxW, boxH, boxD) {
	var side1 = new THREE.Mesh(
	new THREE.PlaneGeometry(boxW, boxH),
    new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture('textures/frozendusk_bk.jpg')
    }));
	side1.position.z = -boxD/2;
	var side2 = new THREE.Mesh(
	new THREE.PlaneGeometry(boxW, boxH),
    new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture('textures/frozendusk_ft.jpg')
    }));
	side2.position.z = boxD/2;
	side2.rotation.y = Math.PI;
	var side3 = new THREE.Mesh(
	new THREE.PlaneGeometry(boxW, boxD),
    new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture('textures/frozendusk_up.jpg')
    }));
	side3.position.y = boxH/2;
	side3.rotation.x = Math.PI / 2;
	side3.rotation.z = Math.PI / 2;
	var side4 = new THREE.Mesh(
	new THREE.PlaneGeometry(boxW, boxD),
    new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture('textures/frozendusk_dn.jpg')
    }));
	side4.position.y = -boxH/2;
	side4.rotation.x = - Math.PI / 2;
	side4.rotation.z = - Math.PI / 2;
	var side5 = new THREE.Mesh(
	new THREE.PlaneGeometry(boxD, boxH),
    new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture('textures/frozendusk_rt.jpg')
    }));
	side5.position.x = boxD/2;
	side5.rotation.y = -Math.PI / 2;

	var side6 = new THREE.Mesh(
	new THREE.PlaneGeometry(boxD, boxH),
    new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture('textures/frozendusk_lf.jpg')
    }));
	side6.position.x = -boxD/2;
	side6.rotation.y = Math.PI / 2;
	
	scene.addObject(side1);
	scene.addObject(side2);
	scene.addObject(side3);
	scene.addObject(side4);
	scene.addObject(side5);
	scene.addObject(side6);
}