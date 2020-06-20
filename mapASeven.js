import React, {useEffect, useState, useRef} from 'react';
import PropTypes from 'prop-types';
import {Chart} from '@antv/g2';
import DataSet from "@antv/data-set";
import {queryMapServer} from '@/services/sandBox'
import {Scene, PolygonLayer, LineLayer, PointLayer, Marker, MarkerLayer} from '@antv/l7';
import {Mapbox} from '@antv/l7-maps';
import {Spin} from "antd";

/**
 * 地图
 * @author 122689
 */
const MapASeven = ({
                       name,//图表名称
                       fileName,//省、市名称
                       onClick = () => {
                       }, //点击事件
                       colorSet = {
                           mapping: 'name', render: [
                               'rgb(239,243,255)',
                               'rgb(189,215,231)',
                               'rgb(107,174,214)',
                               'rgb(49,130,189)',
                               'rgb(8,81,156)'
                           ]
                       },//颜色设置{mapping:'xx',render:()=>{}}
                       className = null,
                       containerStyle = {width: '1000px', height: '800px'},//地图容器样式
                       active = false,//是否显示激活高亮
                       select = false,//是否显示选中高亮
                       shortName = true,//开启地区名称简称（浙江省=》浙江）
                       textAllowOverlap=false,//是否开启文字遮挡显示
                       labelRender = (name) => {
                           return name
                       },//地区名称自定义渲染
                       lineColor = '#ffffff',//地图边界颜色
                       mapComponentDidMount = () => {
                       },//地图场景以及基础图层初始化后调用的方法
                       countryMiddleArea
                   }) => {
    const [id, setId] = useState('MapASeven' + name);
    const [sceneS, setSceneS] = useState(null);
    const [layerS, setLayerS] = useState(null);
    const [loading, setLoading] = useState(false);
    let chartRoot = useRef();
    /**
     * 获取地图数据源缓存代理
     * @type {Proxy|P}
     */
    const mapDataProxy = new Proxy(queryMapServer, {
        apply: async function f(target, thisBinding, args) {
            let params = args[0].fileName + 'mapParam';
            let mapCache = sessionStorage.getItem('mapCache') ? JSON.parse(sessionStorage.getItem('mapCache')) : {};
            if (mapCache && (params in mapCache)) {
                //从缓存中获取地图数据源
               console.log(countryMiddleArea)
                if(countryMiddleArea&&countryMiddleArea.length>0){
                    mapCache[params].features.map((item)=>{
                        countryMiddleArea.map(value=>{
                            if(item.properties.name.indexOf(value.province_name)!=-1){
                                console.log('+++++++++++',item.properties.name,value.province_name,value.manufacturer)
                                item.properties.manufacturer=value.manufacturer
                                item.properties.prisonNumber=value.prisonNumber
                            }
                        })
                    })
                }
                return mapCache[params]; //直接返回
            } else {
                //存储新的地图数据源
                let result = await queryMapServer(args[0]);
                mapCache[params] = result;
                if(countryMiddleArea&&countryMiddleArea.length>0){
                    result.features.map((item)=>{
                        countryMiddleArea.map(value=>{
                            if(item.properties.name.indexOf(value.province_name)){
                                item.properties.manufacturer=value.manufacturer
                                item.properties.prisonNumber=value.prisonNumber
                            }
                        })
                    })
                }
                try {
                    sessionStorage.setItem('mapCache', JSON.stringify(mapCache))
                } catch (e) {
                    console.log(e)
                }
                return result;
            }
        }
    });
    useEffect(() => {
        if (!sceneS) {
            createMap();
        }
        if(layerS){
            layerS.color(
                colorSet.mapping,
                colorSet.render
            )
        }
        return function cleanup() {
            try {
                // sceneS.destroy();//组件卸载时销毁地图场景实例
            } catch (e) {
                console.log(e)
            }
        };
    }, [fileName, colorSet])
    const createMap = () => {
        let scene = new Scene({
            id: id,
            logoVisible: false,
            map: new Mapbox({
                pitch: 0,
                style: 'blank',
                zoom: 10.07,
            })
        });
        setSceneS(scene);
        scene.on('loaded', async () => {
            setLoading(true);
            let mapData = await mapDataProxy({fileName});
            const chinaPolygonLayer = new PolygonLayer({
                autoFit: true,
            })
                .source(mapData)
                .color(
                    colorSet.mapping,
                    colorSet.render
                )
                .shape('fill')
                .style({
                    opacity: 1
                });
            setLayerS(chinaPolygonLayer)
            //  图层边界
            const layer2 = new LineLayer({
                zIndex: 2
            })
                .source(mapData)
                .color(lineColor)
                .size(0.6)
                .style({
                    opacity: 1
                });
            chinaPolygonLayer.active(active);//设置激活颜色高亮
            chinaPolygonLayer.select(select);//设置选中颜色高亮
            scene.addLayer(chinaPolygonLayer);
            scene.addLayer(layer2);
            chinaPolygonLayer.on('click', (e) => {
                onClick(e, chinaPolygonLayer, scene)
            }); // 鼠标左键点击图层事件
            drawLayer('label', scene, mapData, {shortName, labelRender,textAllowOverlap})//绘制地图标签图层
            setLoading(false);
            mapComponentDidMount({layer: chinaPolygonLayer, scene});
        });
    }
    return (
        <Spin tip="地图加载中..." spinning={loading}>
            <div id={id} className={className} style={className ? {} : containerStyle} ref={chartRoot}></div>
        </Spin>
    );
};

MapASeven.propTypes = {
    colorSet: PropTypes.object,
    onClick: PropTypes.func,
    height: PropTypes.number,
    name: PropTypes.string.isRequired,
    fill: PropTypes.string,
    fileName: PropTypes.string.isRequired,
    toolTIpLable: PropTypes.string,
    valueMapping: PropTypes.string,
    unit: PropTypes.string,
    countryMiddleArea:PropTypes.array
};

export default MapASeven;

/**
 *绘制图层
 */
function drawLayer(layerType, scene, data, option) {
    switch (layerType) {
        case 'label':
            createLabelLayer(scene, data, option);
            break;
    }
}

/**
 * 创建标签图层
 * @param scene
 */
function createLabelLayer(scene, data, option) {
    let labelData = []//标签图层数据源
    let {shortName, labelRender,textAllowOverlap} = option;
    data.features.map(item => {
        if (item.properties.parent) {
            item.properties.labelName = item.properties.name;
            if (shortName) {//开启地区简称
                item.properties.labelName = createShotName(item.properties.name);
            }
            item.properties.labelName = labelRender(item.properties.name);
            labelData.push(item.properties)
        }
    })
    const labelLayer = new PointLayer({
        zIndex: 5
    })
        .source(labelData, {
            parser: {
                type: 'json',
                coordinates: 'center'
            }
        })
        .color('#fff')
        .shape('labelName', 'text')
        .size(12)
        .style({
            opacity: 1,
            stroke: '#fff',
            strokeWidth: 0,
            padding: [5, 5],
            textAllowOverlap
        });

    scene.addLayer(labelLayer);
}

/**
 * 生成地区简称
 */
function createShotName(areaName) {
    let pattern = /(省|市|地区|维吾尔自治区|回族自治区|壮族自治区|自治区|区|自治州|自治县|县)$/;
    return areaName.replace(pattern, '')
}
