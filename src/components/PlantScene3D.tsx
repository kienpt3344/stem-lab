import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

interface PlantScene3DProps {
  moisture: number; // 0 - 100
  threshold: number; // e.g. 40
  isPumping: boolean;
  plantName: string;
}

export const PlantScene3D: React.FC<PlantScene3DProps> = ({
  moisture,
  threshold,
  isPumping,
  plantName,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const moistureRef = useRef(moisture);
  const thresholdRef = useRef(threshold);
  const isPumpingRef = useRef(isPumping);

  // Cập nhật refs để render loop luôn có giá trị mới nhất mà không cần tạo lại scene
  useEffect(() => {
    moistureRef.current = moisture;
  }, [moisture]);

  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  useEffect(() => {
    isPumpingRef.current = isPumping;
  }, [isPumping]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Khởi tạo Renderer & kiểm tra Software WebGL theo chuẩn Three.js directive
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 450;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Tạo Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xf1f5f9, 0.04);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    camera.position.set(0, 2.6, 5.2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 1.2, 0);
    controls.minDistance = 2.5;
    controls.maxDistance = 8.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Không nhìn xuyên xuống dưới mặt bàn

    // 3. Môi trường Studio PBR (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Ánh sáng Studio (Warm Key Light + Cool Hemisphere Fill)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x64748b, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff6ea, 1.6);
    keyLight.position.set(4, 7, 3);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
      const d = 3;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xbae6fd, 0.7);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    // 5. Mặt sàn tiếp xúc & Bóng đổ mềm
    const groundGeo = new THREE.PlaneGeometry(12, 12);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.9,
      metalness: 0.0,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = !isSoftwareGl;
    scene.add(ground);

    // Tạo bóng mềm tròn bên dưới đáy chậu (Contact Shadow)
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 60);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
      grad.addColorStop(0.6, 'rgba(15, 23, 42, 0.15)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 2.8),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.01;
    scene.add(contactShadow);

    // 6. TẠO CHẬU CÂY THỦ CÔNG ĐA CHI TIẾT (COMPOSITE 3D MODEL)
    const plantGroup = new THREE.Group();
    plantGroup.position.set(0, 0, 0);
    scene.add(plantGroup);

    // A. Thân chậu sứ gốm (Pot body)
    const potMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Màu gốm xám đen hiện đại
      roughness: 0.35,
      metalness: 0.15,
    });
    const potBody = new THREE.Mesh(
      new THREE.CylinderGeometry(1.05, 0.75, 1.4, 32),
      potMat
    );
    potBody.position.y = 0.72;
    potBody.castShadow = !isSoftwareGl;
    potBody.receiveShadow = !isSoftwareGl;
    plantGroup.add(potBody);

    // B. Vành miệng chậu (Pot Rim)
    const potRim = new THREE.Mesh(
      new THREE.TorusGeometry(1.08, 0.07, 16, 32),
      potMat
    );
    potRim.rotation.x = Math.PI / 2;
    potRim.position.y = 1.42;
    potRim.castShadow = !isSoftwareGl;
    plantGroup.add(potRim);

    // C. Đĩa lót đáy chậu (Saucer Base)
    const saucerMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.2,
    });
    const saucer = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 0.92, 0.12, 32),
      saucerMat
    );
    saucer.position.y = 0.06;
    saucer.castShadow = !isSoftwareGl;
    saucer.receiveShadow = !isSoftwareGl;
    plantGroup.add(saucer);

    // D. Bề mặt đất (Soil) - Thay đổi màu sắc và độ ẩm theo moisture
    // Tạo procedural texture vân hạt đất
    const soilCanvas = document.createElement('canvas');
    soilCanvas.width = 256;
    soilCanvas.height = 256;
    const soilCtx = soilCanvas.getContext('2d');
    if (soilCtx) {
      soilCtx.fillStyle = '#3a2518';
      soilCtx.fillRect(0, 0, 256, 256);
      // Tạo đốm hạt sần sùi
      for (let i = 0; i < 2000; i++) {
        soilCtx.fillStyle = Math.random() > 0.5 ? '#20120a' : '#523a28';
        soilCtx.fillRect(
          Math.random() * 256,
          Math.random() * 256,
          Math.random() * 3 + 1,
          Math.random() * 3 + 1
        );
      }
    }
    const soilTexture = new THREE.CanvasTexture(soilCanvas);
    soilTexture.colorSpace = THREE.SRGBColorSpace;

    const soilMaterial = new THREE.MeshStandardMaterial({
      map: soilTexture,
      roughness: 0.85,
      metalness: 0.05,
    });
    const soilMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 0.98, 0.1, 32),
      soilMaterial
    );
    soilMesh.position.y = 1.36;
    soilMesh.receiveShadow = !isSoftwareGl;
    plantGroup.add(soilMesh);

    // E. Cây trồng (Thân + 7 Nhánh lá héo rủ hoặc vươn thẳng)
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x2e7d32,
      roughness: 0.6,
      metalness: 0.05,
    });
    const stemMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.09, 1.4, 16),
      stemMat
    );
    stemMesh.position.y = 1.36 + 0.7;
    stemMesh.castShadow = !isSoftwareGl;
    plantGroup.add(stemMesh);

    // Tạo hình dáng chiếc lá dạng 3D cong tự nhiên
    const createLeafShape = () => {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.bezierCurveTo(0.2, 0.2, 0.35, 0.6, 0, 1.0);
      shape.bezierCurveTo(-0.35, 0.6, -0.2, 0.2, 0, 0);
      return shape;
    };
    const leafGeo = new THREE.ShapeGeometry(createLeafShape(), 8);
    // Xoay hình chiếc lá về hướng z-forward
    leafGeo.rotateX(Math.PI / 2);

    const leafMaterial = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.45,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    interface LeafPart {
      group: THREE.Group;
      baseAngleX: number;
      baseAngleZ: number;
      droopFactor: number;
      currentPitch: number;
    }

    const leafParts: LeafPart[] = [];
    const leafCount = 8;

    for (let i = 0; i < leafCount; i++) {
      const leafGroup = new THREE.Group();
      const heightFrac = (i + 1) / (leafCount + 1);
      const yPos = 1.45 + heightFrac * 1.1;
      const angleY = (i * (Math.PI * 2)) / 3 + (i * 0.4);

      leafGroup.position.set(0, yPos, 0);
      leafGroup.rotation.y = angleY;

      // Cuống lá (Petiole)
      const petiole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.03, 0.25, 8),
        stemMat
      );
      petiole.position.set(0, 0, 0.12);
      petiole.rotation.x = Math.PI / 2;
      leafGroup.add(petiole);

      // Phiến lá
      const leafMesh = new THREE.Mesh(leafGeo, leafMaterial);
      const scale = 0.55 + (1 - heightFrac) * 0.35; // Lá dưới to hơn lá trên
      leafMesh.scale.set(scale, scale, scale);
      leafMesh.position.set(0, 0, 0.25);
      leafMesh.castShadow = !isSoftwareGl;
      leafGroup.add(leafMesh);

      plantGroup.add(leafGroup);

      leafParts.push({
        group: leafGroup,
        baseAngleX: 0.35 + (1 - heightFrac) * 0.2, // Góc vươn tự nhiên khi khỏe mạnh
        baseAngleZ: (Math.random() - 0.5) * 0.15,
        droopFactor: 0.7 + (1 - heightFrac) * 0.6, // Lá to ở dưới rủ nhiều hơn khi thiếu nước
        currentPitch: 0.35,
      });
    }

    // F. Hiệu ứng hạt nước khi máy bơm đang hoạt động
    const dropletCount = 45;
    const dropletGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const dropletMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.8,
    });
    const dropletInstanced = new THREE.InstancedMesh(dropletGeo, dropletMat, dropletCount);
    dropletInstanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    dropletInstanced.visible = false;
    scene.add(dropletInstanced);

    const dropletPositions: THREE.Vector3[] = [];
    const dropletSpeeds: number[] = [];
    for (let i = 0; i < dropletCount; i++) {
      dropletPositions.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.8,
          2.6 + Math.random() * 0.8,
          (Math.random() - 0.5) * 0.8
        )
      );
      dropletSpeeds.push(0.04 + Math.random() * 0.05);
    }

    const dummy = new THREE.Object3D();

    // 7. VÒNG LẶP RENDER & MÔ PHỎNG VẬT LÝ HÉO/TƯƠI (60 FPS)
    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const healthySoilColor = new THREE.Color(0x20130b); // Đất đen giàu ẩm
    const drySoilColor = new THREE.Color(0x948270); // Đất xám bạc khô cằn
    const healthyLeafColor = new THREE.Color(0x22c55e); // Lá xanh mướt
    const dryLeafColor = new THREE.Color(0xa38a3d); // Lá úa vàng khô héo
    const tempSoilColor = new THREE.Color();
    const tempLeafColor = new THREE.Color();

    const animate = () => {
      const dt = clock.getDelta();
      const currentMoisture = moistureRef.current;
      const currentThreshold = thresholdRef.current;
      const isCurrentlyPumping = isPumpingRef.current;

      // Hệ số sức khỏe từ 0 (khô héo cùng cực) đến 1 (tươi tốt đầy sức sống)
      // Khi độ ẩm < ngưỡng thì bắt đầu héo rủ rõ rệt
      const healthFactor = THREE.MathUtils.clamp(
        (currentMoisture - 10) / Math.max(1, currentThreshold + 20),
        0.0,
        1.0
      );

      // A. Cập nhật màu sắc đất (ẩm -> đen sẫm; khô -> xám nâu nứt nẻ)
      tempSoilColor.lerpColors(drySoilColor, healthySoilColor, healthFactor);
      soilMaterial.color.copy(tempSoilColor);
      soilMaterial.roughness = THREE.MathUtils.lerp(0.95, 0.45, healthFactor);

      // B. Cập nhật màu sắc và độ héo rủ của các lá cây
      tempLeafColor.lerpColors(dryLeafColor, healthyLeafColor, healthFactor);
      leafMaterial.color.copy(tempLeafColor);

      // Tính góc gập/rủ của lá
      // Khi khỏe mạnh: lá hơi chếch lên (pitch ~ 0.3 rad)
      // Khi khô hạn: lá rủ gục xuống đất (pitch ~ 1.4 rad)
      const targetPitchOffset = (1 - healthFactor) * 1.05;

      leafParts.forEach((part, idx) => {
        const targetPitch = part.baseAngleX + targetPitchOffset * part.droopFactor;
        // Damping mượt mà không giật
        part.currentPitch = THREE.MathUtils.damp(part.currentPitch, targetPitch, 4, dt);
        part.group.rotation.x = part.currentPitch;
        part.group.rotation.z = part.baseAngleZ + Math.sin(clock.getElapsedTime() * 1.5 + idx) * 0.02;
      });

      // C. Hiệu ứng tưới nước khi Rơ-le Bơm đang ON
      if (isCurrentlyPumping) {
        dropletInstanced.visible = true;
        for (let i = 0; i < dropletCount; i++) {
          const pos = dropletPositions[i];
          pos.y -= dropletSpeeds[i];
          // Khi hạt rơi chạm mặt đất (Y ~ 1.4), reset lại đỉnh
          if (pos.y < 1.4) {
            pos.y = 2.6 + Math.random() * 0.6;
            pos.x = (Math.random() - 0.5) * 0.75;
            pos.z = (Math.random() - 0.5) * 0.75;
          }
          dummy.position.copy(pos);
          dummy.scale.set(1, 1.8, 1); // Kéo dài giọt nước theo chiều rơi
          dummy.updateMatrix();
          dropletInstanced.setMatrixAt(i, dummy.matrix);
        }
        dropletInstanced.instanceMatrix.needsUpdate = true;
      } else {
        dropletInstanced.visible = false;
      }

      // Xoay nhẹ nhàng chậu cây khi người dùng không tương tác để tăng tính sống động
      plantGroup.rotation.y += 0.0025;

      controls.update();
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // 8. Xử lý Resize
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // 9. Dọn dẹp tài nguyên (Resource Cleanup)
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      groundGeo.dispose();
      groundMat.dispose();
      potBody.geometry.dispose();
      potRim.geometry.dispose();
      potMat.dispose();
      saucer.geometry.dispose();
      saucerMat.dispose();
      soilMesh.geometry.dispose();
      soilMaterial.dispose();
      soilTexture.dispose();
      stemMesh.geometry.dispose();
      stemMat.dispose();
      leafGeo.dispose();
      leafMaterial.dispose();
      dropletGeo.dispose();
      dropletMat.dispose();
      dropletInstanced.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[400px] sm:h-[480px] bg-gradient-to-b from-slate-100 to-slate-200 rounded-3xl overflow-hidden border-2 border-slate-300 shadow-inner">
      {/* Container WebGL thuần túy */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Huy hiệu trạng thái vật lý của cây ở góc trên */}
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-slate-300/80 rounded-xl px-3 py-1.5 shadow-sm pointer-events-none flex items-center gap-2 text-xs">
        <span className="text-base">
          {moisture < threshold ? '🥀' : '🌿'}
        </span>
        <div>
          <span className="font-bold text-slate-800 block">
            {moisture < threshold ? 'Cây đang héo rủ (Thiếu nước)' : 'Cây tươi tốt (Đủ ẩm)'}
          </span>
          <span className="text-[10px] text-slate-500">
            {plantName} • Ngưỡng: {threshold}%
          </span>
        </div>
      </div>

      {/* Hiệu ứng khi đang bơm nước */}
      {isPumping && (
        <div className="absolute top-3 right-3 bg-blue-600 text-white border border-blue-400 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-2 text-xs font-bold animate-bounce pointer-events-none">
          <span className="text-base">💧</span>
          <span>ĐANG BƠM NƯỚC TƯỚI CÂY...</span>
        </div>
      )}

      {/* Ghi chú điều hướng 3D ở góc dưới */}
      <div className="absolute bottom-3 left-3 text-[11px] text-slate-500 bg-white/70 px-2 py-0.5 rounded-lg pointer-events-none">
        🖱️ Giữ chuột trái kéo để xoay 360° • Cuộn chuột để phóng to
      </div>
    </div>
  );
};
