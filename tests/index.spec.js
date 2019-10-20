/* eslint-disable */
import "@babel/polyfill";

import {
    createEntity,
    createComponent,
    createSprite,
    createScene,
    Graphics,
    Camera,
    createViewport,
    ResourceLoader,
    createVec3,
    createRect,
    withTransform,
} from '@source';

const contextMock = {
    save: jest.fn(),
    restore: jest.fn(),
    drawImage: jest.fn(),
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    canvas: {
        width: 100,
        height: 100,
    },
};

Graphics.getInstance().setContext(contextMock);

beforeEach(() => {
    contextMock.save.mockClear();
    contextMock.restore.mockClear();
    contextMock.fillRect.mockClear();
});

describe('Tests for Api', () => {
    describe('Vec3 tests', () => {
        test('Vec3 must return an object with 3 coords, x, y and z', () => {
            const vec3 = createVec3(2, 3, 3);
            expect(vec3.coords).toEqual({ x: 2, y: 3, z: 3 });
        });

        test('Vec3 must allow to multiply by scalar', () => {
            const vec3 = createVec3(2, 2, 2).multiply(2);

            expect(vec3.coords).toEqual({ x: 4, y: 4, z: 4 });
        });

        test('Vec3 must allow to translate its coords to any destination', () => {
            const vec3 = createVec3(1, 2, 3);
            vec3.translateX(4);
            vec3.translateY(4);
            vec3.translateZ(4);

            expect(vec3.coords).toEqual({ x: 4, y: 4, z: 4 });
        });
    });

    describe('Transform tests', () => {
        test('a transform must map another transfor into it', () => {
            const rect = Object.assign({}, withTransform()).setTransform({
                x: 1,
                y: 1,
                z: 2,
                w: 1,
                h: 1,
            });
            const newTransform = rect.mapTransform(({ x, y, ...rest }) => ({
                ...rest,
                x: x + 2,
                y: y + 2,
            }));

            rect.setTransform(newTransform);

            expect(rect.getTransform()).toEqual({ x: 3, y: 3, z: 2, w: 1, h: 1 });
        });
    });

    describe('Rect tests', () => {
        test('Rect factory must return a valid transform object', () => {
            const rect = createRect();

            expect(rect.getTransform()).toEqual({ x: 0, y: 0, z: 0, w: 0, h: 0 });
        });

        test('Rect.setPosition ought to update its transform', () => {
            const rect = createRect().setTransform({ x: 1, y: 1, z: 1, w: 1, h: 1 });
            expect(rect.getTransform()).toEqual({ x: 1, y: 1, z: 1, w: 1, h: 1 });
        });
    });

    describe('Sprite tests', () => {
        test('Sprite must get a transform', () => {
            const sprite = createSprite();

            expect(sprite.getTransform()).toEqual({ x: 0, y: 0, z: 0, w: 0, h: 0 });
        });

        test('Sprite must set the transform', () => {
            const sprite = createSprite().setTransform({ x: 1, y: 2, z: 3, w: 10, h: 10 });

            expect(sprite.getTransform()).toEqual({ x: 1, y: 2, z: 3, w: 10, h: 10 });
        });

        test('Sprite transform must be instance-safe', () => {
            const s1 = createSprite();
            const s2 = createSprite();
            s2.setTransform({ x: 1, y: 2, z: 3, w: 10, h: 10 });

            expect(s2.getTransform()).toEqual({ x: 1, y: 2, z: 3, w: 10, h: 10 });
            expect(s1.getTransform()).toEqual({ x: 0, y: 0, z: 0, w: 0, h: 0 });
        });
    });

    describe('Graphics tests', () => {
        test('Graphics.getSprite must return a Sprite instance with the textureId passed', () => {
            const image = new Image();
            ResourceLoader.getInstance().resources.testTexture = image;

            const sprite = Graphics.getInstance().getSprite('testTexture');

            expect(sprite).not.toBeUndefined();
            expect(sprite.image).toEqual(image);

            ResourceLoader.getInstance().resources = {};
        });

        test('Graphics.drawRect must call to the context api with coords and color', () => {
            const rect = createRect().setTransform(2, 2, 0, 10, 10);
            Graphics.getInstance().drawRect(rect, '#fff');
            const { x, y, w, h } = rect.getTransform();

            expect(contextMock.save).toHaveBeenCalled();
            expect(contextMock.fillRect).toHaveBeenCalledWith(x, y, w, h);
            expect(contextMock.restore).toHaveBeenCalled();
            expect(contextMock.fillStyle).toBe('#fff');
        });

        test('Graphics.clear must call to the context api to clear the canvas', () => {
            Graphics.getInstance().clear();
            expect(contextMock.clearRect).toHaveBeenCalledWith(0, 0, 100, 100);
        });

        test('Graphics.drawSprite must call to the context api to draw a Sprite image in its poisiton', () => {
            const sprite = createSprite({ image: new Image() }).setTransform({
                x: 2,
                y: 3,
                w: 10,
                h: 10,
            });
            Graphics.getInstance().drawSprite(sprite);

            expect(contextMock.drawImage).toHaveBeenCalledWith(
                sprite.image,
                0,
                0,
                10,
                10,
                2,
                3,
                10,
                10,
            );
        });
    });

    describe('Component tests', () => {
        test('Component factory with no params must return a valid compoonent', () => {
            const component = createComponent();

            expect(component.entity.getTransform()).toEqual({
                x: 0,
                y: 0,
                z: 0,
                w: 0,
                h: 0,
            });
            expect(typeof component.update).toBe('function');
            expect(component.graphics.ctx).toEqual(contextMock);
        });

        test('Component update must change its entity', () => {
            const entity = createEntity();
            const comp = createComponent({
                entity,
                update() {
                    this.entity.setTransform({ x: 1, y: 1, z: 1 });
                },
            });

            comp.update();

            expect(entity.getTransform()).toEqual({ x: 1, y: 1, z: 1, h: 0, w: 0 });
        });

        test('if we set a context in Graphics, all components must have that context', () => {
            const mockContext = { drawImage: () => null };
            Graphics.getInstance().setContext(mockContext);

            const comp = createComponent();

            expect(comp.graphics.ctx).toEqual(mockContext);
        });
    });

    describe('Entity tests', () => {
        test('Entity calls by no params must have default values', () => {
            const e = createEntity();
            expect(e.getTransform()).toEqual({
                x: 0,
                y: 0,
                z: 0,
                w: 0,
                h: 0,
            });
        });

        test('Entity must be createdd correctly by its factory', () => {
            const entity = createEntity();

            expect(entity.update).not.toBeUndefined();
            expect(entity.getTransform()).toEqual({
                x: 0,
                y: 0,
                z: 0,
                w: 0,
                h: 0,
            });
        });

        test('Entity must be instance safe', () => {
            const e1 = createEntity().setTransform({ x: 1, y: 2, z: 3 });
            const e2 = createEntity().setTransform({ x: 3, y: 2, z: 1 });

            expect(e2.getTransform().x).toBe(3);
            expect(e1.getTransform().x).toBe(1);
        });

        test('Entity setPosition must return this context', () => {
            const entity = createEntity();

            const ctx = entity.setTransform(0, 0, 0);

            expect(ctx).toEqual(entity);
        });

        test('Entity must have a component collection that will be empty by default', () => {
            const entity = createEntity();
            expect(entity.components).toEqual([]);
        });

        test('Entity addComponent must add a new component object to components collection', () => {
            const entity = createEntity();
            const comp = createComponent();
            entity.addComponent(comp);

            expect(entity.components[0]).toEqual(comp);
        });

        test('Entity addComponent must pass entity context through the component', () => {
            const entity = createEntity({ position: createVec3(1, 2, 3) });
            const comp = createComponent();
            entity.addComponent(comp);

            expect(entity.components[0].entity.position).toEqual(entity.position);
        });

        test('Entity update must call to every component update', () => {
            const entity = createEntity();
            const comp = createComponent({
                update() {
                    this.entity.setTransform({ x: 1, y: 1, z: 1 });
                },
            });

            entity.addComponent(comp);
            entity.update();

            expect(entity.getTransform()).toEqual({
                x: 1,
                y: 1,
                z: 1,
                h: 0,
                w: 0,
            });
        });
    });

    describe('Scene tests', () => {
        test('A scene basic must be created when we invoke Scene factory', () => {
            const scene = createScene();

            expect(scene.entities).toEqual([]);
        });

        test('The scene must allow to add entities to it', () => {
            const scene = createScene();
            const e1 = createEntity();
            const e2 = createEntity();

            scene.addEntity(e1);
            scene.addEntity(e2);

            expect(scene.entities[0]).toEqual(e1);
            expect(scene.entities[1]).toEqual(e2);
        });

        test('Entities must be able to update from a scene', () => {
            const doublePositionComponent = Object.assign(createComponent(), {
                update() {
                    this.entity.transform.position = this.entity.transform.position.multiply(
                        2,
                    );
                },
            });
            const scene = createScene();
            const e1 = createEntity().setTransform({ x: 1, y: 1, z: 1 });

            e1.addComponent(doublePositionComponent);
            const e2 = createEntity();

            scene.addEntity(e1);
            scene.addEntity(e2);

            scene.update();

            expect(e1.getTransform()).toEqual({ x: 2, y: 2, z: 2, w: 0, h: 0 });
        });

        test('Scene must render all entities in viewport coords', () => {});
    });

    describe('Viewport tests', () => {
        test('Viewport without params must return a instance of viewport', () => {
            const viewport = createViewport();

            expect(viewport.getTransform()).toEqual({ x: 0, y: 0, z: 0, w: 0, h: 0 });
        });

        test('Viewport with params musth return a instance configured', () => {
            const viewport = createViewport().setTransform({
                x: 1,
                y: 1,
                z: 0,
                w: 10,
                h: 10,
            });

            expect(viewport.getTransform()).toEqual({
                x: 1,
                y: 1,
                z: 0,
                w: 10,
                h: 10,
            });
        });
    });

    describe('Camera tests', () => {
        test('Camera.getInstance must return a singleton instance from the camera', () => {
            const cam = Camera.getInstance();

            expect(cam.viewport.getTransform()).toEqual({
                x: 0,
                y: 0,
                z: 0,
                w: 0,
                h: 0,
            });
        });

        test('Camera must allow to set a new viewport', () => {
            const viewport = createViewport().setTransform({
                x: 1,
                y: 1,
                z: 0,
                w: 10,
                h: 10,
            });

            const cam = Camera.getInstance().setViewport(viewport);

            expect(cam.viewport.getTransform()).toEqual({
                x: 1,
                y: 1,
                z: 0,
                w: 10,
                h: 10,
            });
        });

        test('Camera must be able to follow an entity centrally', () => {
            const viewport = createViewport().setTransform({
                x: 0,
                y: 0,
                w: 10,
                h: 10,
            });
            const cam = Camera.getInstance().setViewport(viewport);
            const entity = createEntity().setTransform({ x: 5, y: 5, w: 5, h: 5 });

            cam.followEntity(entity);
            const { x, y } = cam.viewport.getTransform();

            expect(x).toBe(2.5);
            expect(y).toBe(2.5);
        });

        test('Camera.getPositionInViewport must return a vec3 in camera coords', () => {
            const viewport = createViewport().setTransform({
                x: 5,
                y: 5,
                z: 0,
                w: 10,
                h: 10,
            });
            const cam = Camera.getInstance().setViewport(viewport);
            const entity = createEntity().setTransform({
                x: 2,
                y: 2,
                w: 10,
                h: 10,
            });

            entity.setTransform(cam.mapTransformInViewport(entity.getTransform()));

            expect(entity.getTransform()).toEqual({
                x: -3,
                y: -3,
                z: 0,
                w: 10,
                h: 10,
            });
        });
    });

    describe('Resources loader tests', () => {
        test('Resource loader factory must return a instance of resource loader', () => {
            const loader = ResourceLoader.getInstance();

            expect(loader.resources).toEqual({});
        });

        /* test('Resource loader must load the list of tuples that is passed', async () => {
            const loader = ResourceLoader.getInstance();

            await loader.load(['cat', 'some/path'], ['bear', 'some/path']);

            expect(loader.get('cat')).not.toBeUndefined();
        });*/
    });
});
