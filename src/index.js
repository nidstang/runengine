export const createVec3 = (x, y, z) => ({
    coords: { x, y, z },
    multiply(scalar) {
        this.coords.x = this.coords.x * scalar;
        this.coords.y = this.coords.y * scalar;
        this.coords.z = this.coords.z * scalar;

        return this;
    },

    translateX(destiny) {
        this.coords.x = destiny;
    },

    translateY(destiny) {
        this.coords.y = destiny;
    },

    translateZ(destiny) {
        this.coords.z = destiny;
    },

    set(coords) {
        this.coords = coords;
    },
});

const TransformProto = {
    position: createVec3(0, 0, 0),
    size: createVec3(0, 0),
};

export const withTransform = () => ({
    transform: Object.create(TransformProto),
    getTransform() {
        const { x = 0, y = 0, z = 0 } = this.transform.position.coords;
        const { x: w = 0, y: h = 0 } = this.transform.size.coords;
        return { x, y, z, w, h };
    },

    setTransform({ x = 0, y = 0, z = 0, w = 0, h = 0 }) {
        this.transform.position = createVec3(x, y, z);
        this.transform.size = createVec3(w, h);
        return this;
    },

    mapTransform(fn) {
        return fn(this.getTransform());
    },
});

const CreateFactory = proto => {
    let instance = null;

    return {
        getInstance() {
            if (!instance) {
                instance = Object.create(proto);
            }

            return instance;
        },
    };
};

const ResourcesLoaderProto = {
    resources: {},

    load(pairs = []) {
        return new Promise((resolve, reject) => {
            let total = pairs.length;

            if (!total) resolve();

            pairs.forEach(([id, url]) => {
                const image = new Image();
                image.src = url;
                image.onload = function onload() {
                    total -= 1;
                    if (total === 0) resolve();
                };
                image.onerror = function onerror(ev) {
                    reject(ev);
                };

                this.resources[id] = image;
            });
        });
    },

    get(id) {
        return this.resources[id];
    },
};

export const ResourceLoader = CreateFactory(ResourcesLoaderProto);

const SpriteProto = {
    setImage(img) {
        this.image = img;
    },
};

export const createSprite = options => (
    Object.assign(Object.create(SpriteProto), withTransform(), options)
);

export const createRect = options => Object.assign(withTransform(), options);

export const createViewport = options => Object.assign(withTransform(), options);

const GraphicsProto = {
    ctx: null,

    setContext(context) {
        this.ctx = context;
    },

    clear() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    },

    drawSprite(sprite) {
        if (this.ctx) {
            const { x, y, w, h } = sprite.getTransform();
            this.ctx.drawImage(sprite.image, 0, 0, w, h, x, y, w, h);
        }
    },

    drawRect(rect, color = '#000') {
        const { x, y, w, h } = rect.getTransform();
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, w, h);
        this.ctx.restore();
    },

    getSprite(textureId) {
        return createSprite({ image: ResourceLoader.getInstance().get(textureId) });
    },
};

export const Graphics = CreateFactory(GraphicsProto);

const CameraProto = {
    viewport: createViewport(),
    setViewport(viewport) {
        this.viewport = viewport;
        return this;
    },

    followEntity(entity) {
        const { x: ex, y: ey, w: ew, h: eh } = entity.getTransform();
        const { w, h } = this.viewport.getTransform();
        this.viewport.setTransform({
            x: ex + ew / 2 - w / 2,
            y: ey + eh / 2 - h / 2,
            w,
            h,
        });
        return this;
    },

    mapTransformInViewport({ x, y, z, w, h }) {
        const { x: vx, y: vy } = this.viewport.getTransform();
        return { x: x - vx, y: y - vy, z, w, h };
    },
};

export const Camera = CreateFactory(CameraProto);

const EntityProto = {
    components: [],
    addComponent(component) {
        this.components = [
            ...this.components,
            Object.assign(component, { entity: this }),
        ];
        return this;
    },

    update() {
        this.components.map(component => component.update());
    },
};

export const createEntity = options => (
    Object.assign(Object.create(EntityProto), withTransform(), options)
);

const ComponentProto = {
    entity: createEntity(),
    graphics: Graphics.getInstance(),

    update: () => true,
};

export const createComponent = options => Object.assign(Object.create(ComponentProto), options);

const SceneProto = {
    entities: [],

    addEntity(entity) {
        this.entities = [...this.entities, entity];
    },

    update() {
        this.entities.map(entity => entity.update());
    },
};

export const createScene = options => Object.assign(Object.create(SceneProto), options);

// / End of engine

// / Example

// const CameraLookat = createComponent({
//     update() {
//         Camera.getInstance().followEntity(this.entity);
//     },
// });

// const RectRenderer = createComponent({
//     init() {
//         const { x, y } = this.entity.getTransform();
//         this.rect = createRect().setTransform({ x, y, w: 10, h: 10 });
//         Graphics.getInstance().drawRect(this.rect);
//         return this;
//     },
//     update() {
//         this.rect.setTransform(
//             Camera.getInstance().mapTransformInViewport(this.entity.getTransform()),
//         );

//         Graphics.getInstance().drawRect(this.rect, this.color);
//     },
// });

// const Renderer = createComponent({
//     setSprite(sprite) {
//         this.sprite = sprite;
//         return this;
//     },

//     setTexture(textureId) {
//         this.sprite = Graphics.getInstance().getSprite(textureId);
//         this.sprite.setTransform(this.entity.getTransform());
//         Graphics.getInstance().drawSprite(this.sprite);
//         return this;
//     },

//     update() {
//         if (this.sprite) {
//             this.sprite.setTransform(
//                 Camera.getInstance().mapTransformInViewport(this.entity.getTransform()),
//             );

//             Graphics.getInstance().drawSprite(this.sprite);
//         }
//         return this;
//     },
// });

// Camera.getInstance().setViewport(createViewport().setTransform({ w: 100, h: 100 }));
// const rectRenderer1 = Object.create(RectRenderer);
// const rectRenderer2 = Object.assign(Object.create(RectRenderer), {
//     color: '#539865',
// });
// const renderer = Object.create(Renderer);
// const PlayerEntity = createEntity({
//     moveEst() {
//         const { x, y, w, h } = this.getTransform();
//         this.setTransform({ x: x + 10, y, w, h });
//     },

//     moveWest() {
//         const { x, y, w, h } = this.getTransform();
//         this.setTransform({ x: x - 10, y, w, h });
//     },

//     moveNorth() {
//         const { x, y, w, h } = this.getTransform();
//         this.setTransform({ x, y: y - 10, w, h });
//     },

//     moveSouth() {
//         const { x, y, w, h } = this.getTransform();
//         this.setTransform({ x, y: y + 10, w, h });
//     },
// }).setTransform({ x: 10, y: 10, w: 100, h: 100 });

// PlayerEntity.addComponent(CameraLookat).addComponent(rectRenderer1);
// const TreeEntity = createEntity({
//     init() {
//         renderer.setTexture('tree');
//     },

// }).setTransform({ x: 150, y: 20, w: 100, h: 100 }).addComponent(renderer);

// const MainScene = createScene({
//     entities: [TreeEntity, PlayerEntity],
// });

// const canvas = document.getElementById('canvas');
// const ctx = canvas.getContext('2d');

// const animate = () => {
//     Graphics.getInstance().clear();
//     MainScene.update();
//     requestAnimationFrame(animate);
// };

// const init = () => {
//     Graphics.getInstance().setContext(ctx);
//     rectRenderer1.init();
//     // rectRenderer2.init();
//     TreeEntity.init();
//     animate();
// };

// // animate();

// const loader = ResourceLoader.getInstance();

// loader.load([['tree', 'https://www.iucn.org/sites/dev/files/styles/media_thumbnail/public/content/images/2019/horse_chestnut_aesculus_hippocastanum_vulnerable_pixabay.jpg?itok=gdioJmlY']]).then(init);

// document.getElementById('north').addEventListener('click', () => {
//     PlayerEntity.moveNorth();
// });

// document.getElementById('south').addEventListener('click', () => {
//     PlayerEntity.moveSouth();
// });

// document.getElementById('west').addEventListener('click', () => {
//     PlayerEntity.moveWest();
// });

// document.getElementById('est').addEventListener('click', () => {
//     PlayerEntity.moveEst();
// });

/* const Renderer = Component({
    setSprite: function(sprite) {
      this.sprite = sprite;
      return this;
    },

    setTexture: function(textureId) {
      this.sprite = Graphics.getInstance().getSprite(textureId);
      this.sprite.setPosition(this.entity.position);
      Graphics.getInstance().drawSprite(this.sprite);
      return this;
    },

    update: function() {
      if (this.sprite) {
        const entityPos = this.entity.position;
        this.sprite.setPosition(
          Camera.getInstance().getPositionInViewport(entityPos)
        );
      }

      return this;
    }
  }); */
