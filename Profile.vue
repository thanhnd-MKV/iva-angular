<template>
    <div v-loading="trackloading" class="profile-container">
        <div class='Breadcrumb'>
            <div class="left">
                <div class="icon-line"></div>
                <header>{{ t($route.name) }}</header>
                <div v-show="needShowPlate" style="margin-left: 10px">{{
                    detailPlateNo ? '(' + detailPlateNo + ')' : ''
                    }}</div>
            </div>
            <div class="right fleet-header">
                <div class="header-fleet-name">{{ subscribeInfo.name }}</div>
                <div class="header-time">
                    <div class="baseTimeHour">{{ baseTimeHour }}</div>
                    <div style="font-size: 18px; padding-left: 4px; padding-right: 4px;">|</div>
                    <div class="baseTimeDate">{{ baseTime }}</div>
                </div>
            </div>
        </div>
        <div class="fleet-index">
            <div v-show="!isDetail" class="detail-container">
                <div class="totalcars">
                    <div class="top" style="padding-bottom: 6px">
                        <div class="all-car">
                            <div class="all-car-text">{{ t('合计') }}</div>
                            <div class="all-car-number">{{ tableTotal }}</div>
                        </div>
                        <div class="all-car-driving">
                            <div class="all-car-driving-text">{{ t('行驶') }}</div>
                            <div class="all-car-driving-number">{{ drivingTotal > 0 ? drivingTotal : 0 }}</div>
                        </div>
                        <div class="all-car-pak">
                            <div class="all-car-pak-text">{{ t('停车') }}</div>
                            <div class="all-car-pak-number">{{ parkingTotal > 0 ? parkingTotal : 0 }}</div>
                        </div>
                    </div>
                    <div class="sort">
                        <div style="margin-right: 30px;margin-left: 20px">{{ t('排序方式') }}</div>
                        <el-select style="max-width:170px;" class="status-camera" @change="handleSortChange"
                            v-model="queryForm.orderRule" placeholder="Status">
                            <el-option :value="1" :label="t('状态')"></el-option>
                            <el-option :value="2" :label="t('车牌号')"></el-option>
                            <el-option :value="3" :label="t('行驶里数')"></el-option>
                            <el-option :value="4" :label="t('行驶时间')"></el-option>
                            <el-option :value="5" :label="t('事件')"></el-option>
                        </el-select>
                    </div>
                </div>
                <div class="pageList" v-if="dataList.length">
                    <div class="pageList-container">
                        <div class="car-item" v-for="(item, index) in dataList" :key="index">
                            <div style="width: 100%"
                                @click="handleDetailClick(item.cameraSn, item.plateNo, item.driverName, item)">
                                <div class="right">
                                    <div class="top" style="padding-bottom: 0">
                                        <div class="tit">
                                            <div class="dirivername">
                                                <span class="xhnum">{{
                                                    item.plateNo
                                                    }}</span>
                                                <div class="num-detail-speed">
                                                    <div class="left">
                                                        <div v-if="item.mode === 'driving'" class="status-car-driving">
                                                            {{
                                                                t('行驶')
                                                            }}</div>
                                                        <div v-else :name="'greencar'" class="status-car-pak">{{ t('停车')
                                                            }}
                                                        </div>
                                                    </div>
                                                    <span class="num-speedDevcie">{{ speedValue(item.speedDevice)
                                                        }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="diriver-svg" style="display: flex">
                                            <svg-icon
                                                v-show="item.isOnline && item.signalInfo && item.signalInfo.rsrp > -65"
                                                :name="'xinhao'"></svg-icon>
                                            <svg-icon
                                                v-show="item.isOnline && item.signalInfo && item.signalInfo.rsrp <= -65"
                                                :name="'xinh3'"></svg-icon>
                                            <svg-icon v-show="!item.isOnline || !item.signalInfo"
                                                :name="'offline'"></svg-icon>
                                            <div @click="handleTripDetail(item.cameraSn)"
                                                style="margin-left: 6px;color:  #727880;margin-top: -1px">
                                                <el-popover v-show="item.driverName" placement="top-start"
                                                    min-width="100" trigger="hover" :content="item.driverName">
                                                    <div class="xinhao" slot="reference">{{
                                                        item.driverName ||
                                                        tt('No Data')
                                                        }}
                                                    </div>
                                                </el-popover>
                                                <el-popover v-show="!item.driverName" placement="top-start"
                                                    min-width="100" :content="item.driverName">
                                                    <div class="xinhao" slot="reference">{{
                                                        item.driverName ||
                                                        tt('No Data')
                                                        }}
                                                    </div>
                                                </el-popover>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="bottom" style="display: flex;justify-content: space-between;">
                                        <div>
                                            <div class="icon-bottom-item">
                                                <img class="icon-bottom-detail" src="../assets/timerr.svg" />
                                                <span class="num">{{ formatHour(item.hours) }}</span>
                                            </div>
                                            <div class="icon-bottom-item">
                                                <img class="icon-bottom-detail" src="../assets/warningIcon.svg" />
                                                <span class="num">{{ item.events }}</span>
                                            </div>
                                            <div class="icon-bottom-item">
                                                <img class="icon-bottom-detail" src="../assets/routing-2.svg" />
                                                <span class="num">{{ milesValue(item.miles) }}</span>
                                            </div>
                                        </div>
                                        <div class="icon-bottom-btn">
                                            <img style="margin-right: 5px;width: 13px;margin-left: 6px;"
                                                src="../assets/video.svg" alt="" @click.stop="handlePlayLive(item)">
                                            <div style="width: 1px;height: 16px;background-color: #C3E5F9;margin-top: 2px;
                                                        margin-right: 4px;margin-left: 0px;"></div>
                                            <img style="margin-right: 5px;width: 13px" src="../assets/element-4.svg"
                                                alt="">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else style="text-align: center">
                    <svg-icon :name="'nodata'" style="width: 100px;height: 100px"></svg-icon>
                    <div>{{ tt('No Data') }}</div>
                </div>
                <el-pagination v-show="dataList.length" background layout="total, prev, pager, next"
                    @current-change="loadData" :page-size="queryForm.pageSize"
                    :current-page.sync="queryForm.currentPage" :total="tableTotal">
                </el-pagination>
            </div>
            <div v-show="isDetail" class="detail-container">
                <div class="tab-bar-container">
                    <el-tabs class="tab-bar" v-model="detailName" type="card" @tab-click="handleDetailChange">
                        <el-tab-pane :label="t('事件')" name="Event"></el-tab-pane>
                        <el-tab-pane :label="t('行程')" name="Trip"></el-tab-pane>
                    </el-tabs>
                    <div class="back-item">
                        <div class="back" @click="handleBack">
                            <img src="@/assets/arrow-left.svg" alt="" />
                        </div>
                    </div>
                </div>
                <header class="detailHead">
                    <el-form size="small" :label-width="locals === 'vi' ? '75px' : '75px'" :model="searchForm"
                        style="padding-left: 4px;padding-right: 4px">
                        <el-form-item style="margin-top: 12px;margin-bottom: 14px;" :label="t('时长')"
                            :label-width="'90px'" v-show="detailName === 'Event'">
                            <el-date-picker v-model="timeValue" type="daterange" :start-placeholder="tt('开始日期')"
                                :end-placeholder="tt('结束日期')" :default-time="['00:00:00', '23:59:59']"
                                :placeholder="tt('选择日期')" class="EventPickerTime"
                                style="width: 92%;height: 35px !important;font-size: 12px;" :clearable="false"
                                @change="onTimeChange">
                            </el-date-picker>
                        </el-form-item>
                        <el-form-item style="padding-top: 6px;margin-bottom:6px;" :label="t('时长')"
                            :label-width="'100px'" v-show="detailName === 'Trip'">
                            <div style="display: flex">
                                <el-date-picker v-model="timeDay" type="date" :placeholder="tt('选择日期')"
                                    style="width: 100%;display: flex; padding-left: 4px !important;"
                                    @change="onDayChange" :clearable="false" format="dd-MM-yyyy">
                                </el-date-picker>
                                <el-tooltip class="item" effect="light" :content="t('MessFilter')" placement="bottom">
                                    <el-button class="fillterBtn" @click="handleFilter">{{
                                        t('Filter') }}</el-button>
                                </el-tooltip>
                            </div>
                        </el-form-item>
                        <el-form-item :label="t('事件')" v-show="detailName === 'Event'" :label-width="'90px'">
                            <el-select clearable v-model="detailQueryForm.eventGroup"
                                @change="handleOneDetail(cameraSn)" :placeholder="tt('请选择')" style="width: 92%;">
                                <el-option v-for="(item, index) in eventCategory" :value="item.value" :label="item.name"
                                    :key="index"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-form>
                </header>
                <div v-show="detailName === 'Trip'" class="detaillist">
                    <div v-if="detailName === 'Trip' && tripData.length">
                        <div class="collapse">
                            <div class="items">
                                <el-collapse v-model="collapseNames" accordion @change="handlecCllapseChange">
                                    <el-collapse-item v-for="(item, index) in tripData" :key="index"
                                        :title="String(item.id)" :name="index + 1" :data-trip-index="index" :data-trip-id="item.tripId">
                                        <template slot="title">
                                            <div class="detail"
                                                @click="cllapseVal !== index + 1 ? handleTripTitleClick(item.tripId, item) : ''">
                                                <div v-show="cllapseVal === index + 1" class="trip-item-title">{{
                                                    t(item.driverName)
                                                    }}</div>
                                                <div class="container-header">
                                                    <div class="trip-item">{{ t('Trip') }} {{ item.id }}</div>
                                                    <div class="trip-min-speed">{{
                                                        item.timeInterval + tt('Mins') + ' | '
                                                        }}
                                                        <p style="width: 2px"></p>
                                                        <p class="trip-min-speed-right">
                                                        <p>{{
                                                            item.distance / 1000 +
                                                            ' KM'
                                                            }}</p>
                                                        {{ /* eslint-disable */ }}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div style="margin-top: 4px; margin-right: 6px; margin-left: 6px;"
                                                    class="lines">
                                                    <img src="../assets/top-ev.svg" />
                                                    <span class="line"> </span>
                                                    <span class="iconTips" v-if="item.eventCount">
                                                        <div class="tipsbox">
                                                            <img src="../assets/EvnIcon.svg"
                                                                style="width: 22px;height: 22px" />
                                                            <el-badge :value="item.eventCount" class="item"></el-badge>
                                                        </div>
                                                    </span>
                                                    <img v-show="item.parkingTime" src="../assets/bot-ev.svg" />
                                                    <img v-show="!item.parkingTime" src="../assets/top-ev.svg" />
                                                </div>
                                                <div class="detail-trip">
                                                    <span>{{ defaultGMTValue(item.drivingTime) }}</span>
                                                    <span>{{
                                                        item.parkingTime ? ((item.parkingTime) !== null ?
                                                            defaultGMTValue(item.parkingTime) : '') :
                                                            t('Now')
                                                    }}</span>
                                                </div>
                                            </div>
                                        </template>

                                        <div class="noti-trip">
                                            <div class="noti-trip-img">
                                                <img class="noti-trip-img" src="../assets/BrandLogo.svg" />
                                            </div>
                                            <div class="noti-trip-text">
                                                <div class="noti-trip-item">{{ dataDetailMap.type }}</div>
                                                <div class="noti-trip-sub-item">{{ dataDetailMap.brand }}</div>
                                            </div>
                                        </div>

                                        <div class="section">
                                            <div class="section-div">
                                                <div style="height: 38px;width: 3px;position: relative;left: 10px;top: 20px;"
                                                    class="left-col-solid"></div>
                                                <img style="margin-bottom: 19px;position: relative;z-index: 1;left: -2px"
                                                    src="../assets/top-ev.svg" />
                                                <div class="title">
                                                    <span>{{ (driverName ? driverName : tripEventData[0].driverName) +
                                                        t('进入驾驶') }} </span>
                                                    <span class="time">{{ defaultGMTValue(item.drivingTime) }}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="evnttrip" :class="isActive === indexs ? 'isactive' : ''"
                                            v-for="(items, indexs) in tripEventData" :key="indexs">
                                            <div class="events" style="margin-left: 18px;">
                                                <div v-if="items.gpsLatitude" @click="loadEventVideo(items, indexs)"
                                                    style="width: 100%;">
                                                    <div class="leftbox">
                                                        <div class="left-col-solid"></div>
                                                        <div style="height: 58px;position: relative;z-index: 1;left: -1px"
                                                            class="left">
                                                            <img style="margin-top: 20px;" src="../assets/mid-ev.svg" />
                                                        </div>
                                                        <div class="rightt">
                                                            <span class="event-typet">{{
                                                                handleCVEvent(items.eventType)
                                                                }}</span>
                                                            <span class="timet">{{
                                                                defaultGMTValue(items.updateTime)
                                                                }}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div v-else
                                                    @click="handlePlayVideo(items.id, indexs, items.gpsLongitude, items.gpsLatitude)"
                                                    style="width: 100%;">
                                                    <div class="leftbox">
                                                        <div class="left-col-solid"></div>
                                                        <div style="height: 58px;position: relative;z-index: 1;left: -1px"
                                                            class="left">
                                                            <img style="margin-top: 20px;" src="../assets/mid-ev.svg" />
                                                        </div>
                                                        <div class="rightt">
                                                            <span class="event-typet">{{
                                                                handleCVEvent(items.eventType)
                                                                }}</span>
                                                            <span class="timet">{{
                                                                defaultGMTValue(items.updateTime)
                                                                }}</span>
                                                        </div>

                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                        <div class="section" style="border-bottom: 0px">
                                            <div class="section-div">
                                                <div style="height: 38px;width: 3px;position: relative;left: 10px;bottom: 14px;"
                                                    class="left-col-solid"></div>
                                                <img v-show="carDriving === false"
                                                    style="position: relative;z-index: 1;left: -2px"
                                                    src="../assets/bot-ev.svg" />
                                                <img v-show="carDriving === true"
                                                    style="position: relative;z-index: 1;left: -2px"
                                                    src="../assets/top-ev.svg" />
                                                <div class="title">
                                                    <span class="title-bottom-section">{{
                                                        item.parkingTime ? (driverName ? driverName :
                                                            tripEventData[0].driverName)
                                                            + t('走进停车场') : (driverName ? driverName :
                                                                tripEventData[0].driverName) + ' ' + t('Driving')
                                                    }}</span>
                                                    <span class="time">{{
                                                        item.parkingTime ? defaultGMTValue(item.parkingTime) : t('Now')
                                                        }}</span>
                                                </div>
                                            </div>
                                        </div>

                                    </el-collapse-item>

                                </el-collapse>
                            </div>
                        </div>
                    </div>
                    <div v-if="detailName === 'Trip' && !tripData.length" style="text-align: center">
                        <svg-icon style="width: 130px;height: 120px" :name="'nodata'"></svg-icon>

                        <div>{{ tt('No Data') }}</div>
                    </div>
                </div>
                <div v-show="detailName === 'Event'" class="detaillistEvent">
                    <div v-if="detailName === 'Event' && timeEventListCV.length">
                        <div v-for="(item, index) in timeEventListCV" :key="index">
                            <div class="event-data-item">
                                <div class="eventtop">
                                    <div class="headerEvent-title">
                                        <div class="headerEvent-title-time">{{ item[0].startTime }}</div>
                                        <div class="headerEvent-title-evtLength">{{ item.length }}</div>
                                    </div>
                                </div>
                                <div>
                                    <div class="evnttrip" :class="isActive === indexs ? 'isactive' : ''"
                                        v-for="(items, indexs) in item" :key="indexs" style="">
                                        <div class="events" style="margin-right: 17px">
                                            <div v-if="items.gpsLatitude" @click="eventListMap(items, indexs)">
                                                <div class="leftbox">
                                                    <div class="right" style="padding-bottom: 22px;">
                                                        <span class="time">{{ defaultGMTValue(items.updateTime)
                                                            }}</span>
                                                        <span class="event-type" style="margin: 6px 0">{{
                                                            handleCVEvent(items.eventType)
                                                        }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div v-else
                                                @click="handlePlayVideo(items.id, indexs, items.gpsLongitude, items.gpsLatitude)">
                                                <div class="leftbox">
                                                    <div class="right" style="padding-bottom: 22px;">
                                                        <span class="time">{{ defaultGMTValue(items.updateTime)
                                                            }}</span>
                                                        <span class="event-type" style="margin: 6px 0">{{
                                                            handleCVEvent(items.eventType)
                                                        }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-if="detailName === 'Event' && !timeEventListCV.length" style="text-align: center">
                        <svg-icon style="width: 130px;height: 120px" :name="'nodata'"></svg-icon>
                        <div>{{ tt('No Data') }}</div>
                    </div>
                </div>
            </div>
            <div class="myMap" style="height: 85vh;width: 100%">
                <div class="map-iframe">
                    <div id="map" style="height: 85vh;width: 100%">
                    </div>
                </div>
                <div v-show="isDetail" v-if="detailName === 'Trip'" class="detail-map-user-driver"
                    style="width:83%;height: 45px">
                    <div class="img-map-user-driver">
                        <img src="../assets/henry.svg" class="img-map-item" />
                        <div class="img-map-user-driver-container">
                            <div class="img-map-user-name">
                                {{ dataDetailMap.driverName }}</div>
                            <div class="img-map-user-trip-detail">
                                <div class="img-map-user-trip-detail-item">
                                    <img class="img-map-user-trip-detail-item-img" src="../assets/timerr.svg" />
                                    <div class="img-map-user-trip-detail-item-text">{{ totalHours }}</div>
                                </div>
                                <div class="img-map-user-trip-detail-item">
                                    <img class="img-map-user-trip-detail-item-img" src="../assets/warningIcon.svg" />
                                    <div class="img-map-user-trip-detail-item-text">{{ totalEventCount }}
                                    </div>
                                </div>
                                <div class="img-map-user-trip-detail-item">
                                    <img class="img-map-user-trip-detail-item-img" src="../assets/routing-2.svg" />
                                    <div class="img-map-user-trip-detail-item-text">
                                        {{ milesValue(totalMiles) }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="img-map-contact">
                        <div class="detail-map-user-driver-contact" @click="handleCopyLink">
                            <img src="../assets/copy.svg" class="img-map-contact-item-img"
                                style="width: 14px;height: 14px;margin-top: 4px;margin-right: 3px;" />
                            <div class="img-map-contact-item-text">{{ tt('Copy trip') }}</div>
                        </div>
                        <div class="detail-map-user-driver-live" @click="handlePlayLive(dataDetailMap)">
                            <img src="../assets/videoicon.svg" class="img-map-contact-item-img"
                                style="margin-top: 1px" />
                            <div class="img-map-contact-item-text" style="margin-left: 2px;">Live Cam</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
        <play-video :videoDio="videoDio" locationDialogShow :eventId="eventId" :videoGpsLongitude="videoGpsLongitude"
            :videoGpsLatitude="videoGpsLatitude" @hideDetail="hideDetail" @closeloading="closeloading">
        </play-video>
        <el-dialog title="Live Stream" style="margin-top: -8vh" width="740px" :visible.sync="liveDio" destroy-on-close
            :before-close="handleCloseWowza" :close-on-click-modal="false" ref="videoPlayer" class="video-live-dialog">
            <div class="wakeupfail" v-if="isOffline">
                <div style="display: flex;">
                    <i class="el-icon-error"></i>
                    <span class="tips">{{ t('设备已离线。') }}</span>
                </div>
            </div>
            <div v-if="itemData.mode === 'driving'">
                <div style="height: 500px" :element-loading-text="t('正在唤醒')" v-loading="waitloading" v-if="waitloading">
                </div>
            </div>
            <div v-else>
                <div style="height: 500px" :element-loading-text="t('正在唤')" v-loading="waitloading" v-if="waitloading">
                </div>
            </div>
            <div class="wakeupfail" v-if="wakeupFail && !waitloading">
                <div v-if="!itemData.isOnline && itemData.mode === 'parking'">
                    <div style="display: flex;">
                        <i class="el-icon-error"></i>
                        <div class="title">
                            <span class="tips">{{ t('设备已离线。') }}</span>
                        </div>
                    </div>
                    <div style="width: 100%;justify-content: center;display: flex;">
                        <el-button class="btn-refresh" @click="handleRefresh">{{ t('重新唤醒') }}</el-button>
                    </div>
                </div>
                <div style="display: flex;" v-else>
                    <i class="el-icon-error"></i>
                    <div class="title">
                        <span class="tips">{{ t('唤醒失败') }}</span>
                        <div style="width: 100%;justify-content: center;display: flex;">
                            <el-button class="btn-refresh" @click="handleRefresh">{{ t('重新唤醒') }}</el-button>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="!waitloading && !wakeupFail && !isOffline">
                <div class="videotop">
                    <span>Live</span>
                    <span>{{ itemData.driverName }}</span>
                    <span>|</span>
                    <span>{{ itemData.plateNo }}</span>
                    <span>{{ kbstatus + 'kb/s' }}</span>

                </div>
                <div v-if="canClick" class="reweak" style="text-align: center">
                    {{ t('播放时间只有2分钟，请重新唤醒') }}
                </div>
                <videoPlayer class="vjs-custom-skin videoPlayer" :options="playerOptions" ref="videoPlayer"
                    :playsinline="true" @pause="onPlayerPause($event)" @play="onPlayerPlay($event)"
                    @ended="onPlayerEnded($event)">
                </videoPlayer>
            </div>
        </el-dialog>
        <el-dialog :visible.sync="dialogVideo">
        </el-dialog>
    </div>
</template>

<script lang='ts'>
/* eslint-disable */
import Vue from 'vue';
import Component from 'vue-class-component';
import * as Utils from '../utils';
import { BaseMixin } from '@/components/BaseMixin';
import 'video.js/dist/video-js.css';
import 'vue-video-player/src/custom-theme.css';
import { videoPlayer } from 'vue-video-player';
import 'videojs-flash';
import PlayVideo from '@/components/profile/PlayVideo.vue';
import { Alert } from 'element-ui';
@Component({
    components: {
        videoPlayer,
        PlayVideo,
    }
})
export default class Profile extends BaseMixin {
    detailPlateNo: any = '';
    driverName: any = '';
    needShowPlate: boolean = false;
    queryForm = {
        currentPage: 1,
        orderRule: 1,
        pageSize: 10,
        searchDate: ''
    };
    detailQueryForm = {
        searchEndDate: '',
        searchStartDate: '',
        eventGroup: ''
    };
    tripQueryForm = {
        searchDate: ''
    };
    tableTotal: number = 0;
    drivingTotal: number = 0;
    parkingTotal: number = 0;
    baseTime: any = '';
    baseTimeHour: any = '';
    itemIndex = 0;
    sortValue: any = '';
    isDetail: boolean = false;
    detailName: string = '1';
    timeValue: any = [];
    timeDay: any = '';
    searchForm: any = {
        type: ''
    };
    cardetailDio: boolean = false;
    hover: boolean = false;
    overIndex: number = 0;
    clickIndex: number = 0;
    tripId: any;
    carDriving: any;
    dataList: any = [];
    loading: boolean = false;
    dialogVideo: boolean = false;
    eventsData: any = [];
    cameraSn: any = '';
    tripData: any = [];
    OriginData: any = [];
    dataVideo: any = [];
    result: any = [];
    tripGpsData: any = [];
    totalHours: any = [];
    totalMiles: any = [];
    totalEventCount: any = [];
    roadToMapDaTa: any = [];
    linePolyline: any = [];
    polylines: any = [];
    locations: any = [];
    tripEventData: any = [];
    dataFilter: any = false;
    t(key: string): string {
        return Utils.i18nt('profile', key);
    }
    tt(key: string): string {
        return Utils.i18nt('common', key);
    }
    eventCategory = [
        { value: 1, name: this.t('DRIVING AND PARKING') },
        { value: 2, name: this.t('ACCELERATOR') },
        { value: 3, name: this.t('DMS') },
        { value: 4, name: this.t('DRIVER_MANAGEMENT') },
        { value: 5, name: this.t('MANUAL') },
    ];
    bulecar = 'https://data.waylens.com/9f713b2bc66f16a4cc741fd5a92b00b7.svg';
    greencar = 'https://data.waylens.com/d602e1e6c7b61706942990ff1dd6a7be.svg';
    officon = 'https://data.waylens.com/eeff4a9dee78df641f994707424034c6.svg';
    eventicon = 'https://data.waylens.com/0c5321a10142e8bbc5d81d6154c9cd39.svg';
    cariconSymbol: string = '';
    timeEventList: any = [];
    timeEventListCV: any = [];
    videoDio: boolean = false;
    eventId: any = '';
    isActive: any = '';
    wakeupFail: boolean = false;
    cllapseVal: string | number = '';
    collapseNames: number = 1;
    idSetTimerout: any = -1;
    videoGpsLongitude: string | number = '';
    videoGpsLatitude: string | number = '';
    mapCenterLat: number = 21.02722522445357;
    mapCenterLng: number = 105.83662025396546;
    centerZoom: number = 15;
    liveDio: boolean = false;
    liveData: any = {
        transactionId: '',
        liveStatus: '',
        playUrl: ''
    };
    waitloading: boolean = false;
    itemData: any = {};
    countContent: any = this.t('重新唤醒');
    totalTime: number = 120;
    canClick: boolean = true;
    timer: any = '';
    kbstatus: string = '0.00';
    statustimer: any = '';
    hostName = 'http://fms.mkvision.com/';
    noData = require('../assets/noData.jpg');
    dataDetailMap: any = [];
    clock: any = '';
    isOffline: boolean = false;
    needclose: boolean = false;
    subscribeInfo: any = {};
    playerOptions: any = {
        playbackRates: [0.5, 1.0, 1.5, 2.0],
        autoplay: true,
        muted: false,
        loop: false,
        preload: 'auto',
        language: 'vi',
        aspectRatio: '16:9',
        fluid: true,
        sources: [
            {
                type: 'application/x-mpegURL',
                src: ''
            }
        ],
        poster: '',
        notSupportedMessage: '',
        controlBar: {
            timeDivider: false,
            durationDisplay: false,
            remainingTimeDisplay: false,
            fullscreenToggle: true
        },
        controls: true,
    };
    videoEvent: any = '';
    trackloading: boolean = false;
    wowza: boolean = false;
    vm: any;
    cancelAPI = new AbortController();
    onVideoClose() {
        this.onPlayerEnded(this.videoEvent, true);
        this.cancelAPI.abort();
        this.timer = '';
        clearTimeout(this.timer);
        this.wakeupFail = false;
    }

    handleCloseWowza() {
        this.waitloading = false;
        this.loading = false;
        this.liveDio = false;
        this.isOffline = true;
        window.clearInterval(this.clock);
        window.clearTimeout(this.statustimer)
        window.clearTimeout(this.timer)
        window.clearTimeout(this.idSetTimerout)
    }
    checkImagegetImage(url) {

    }
    onPlayerPause(event: any) {
    }

    onPlayerPlay(event: any) {
    }

    async handleVideo() {
        this.wowza = !this.wowza;
    }

    async onPlayerEnded(event: any, needclose?: boolean) {
        this.videoEvent = event;
        this.needclose = !!needclose;
        clearTimeout(this.timer);
        clearTimeout(this.statustimer);
        if (this.liveData.liveStatus === 'live') {
            this.destoryVideo();
        }
        this.liveData.liveStatus = '';
    }

    destoryVideo() {
        let myPlayer = (this.$refs as any).videoPlayer;
        if (myPlayer) {
            myPlayer.dispose();
        }
    }

    handleSortChange() {
        this.loadData();
    }

    async loadData() {
        this.trackloading = true;
        let params = Utils.queryFormWrapper(this.queryForm);
        let resp = await Utils.doGet(this, `/api/admin/fleet-view/page?${params}`, this.cancelAPI);
        if (resp.success) {
            this.trackloading = false;
            this.dataList = resp.data.records;
            this.drivingTotal = resp.data.drivingTotal;
            this.parkingTotal = resp.data.parkingTotal;
            this.tableTotal = resp.data.total;
            this.loadPointMapCenter(this.dataList, 'point');
            this.initMaps();
        } else {
            this.trackloading = false;
            Utils.showWarning(this.formatMess(resp.code));
        }
    }

    loadPointMapCenter(data: any, type: string) {
        let coordinate1: any = [];
        let coordinate2: any = [];
        if (data.length) {
            if (type === 'point') {
                data.forEach((item: any) => {
                    if (item.gpsData) {
                        coordinate1.push(item.gpsData.coordinate[0]);
                        coordinate2.push(item.gpsData.coordinate[1]);
                    }
                });
            } else if (type === 'line') {
                data.forEach((item: any) => {
                    coordinate1.push(item.coordinate[0]);
                    coordinate2.push(item.coordinate[1]);
                });
            } else if (type === 'points') {
                data.forEach((item: any) => {
                    if (item.gpsLatitude && item.gpsLongitude) {
                        coordinate1.push(item.gpsLongitude);
                        coordinate2.push(item.gpsLatitude);
                    }
                });
            }
        }
        if (coordinate1.length && coordinate2.length) {
            let max1 = Math.max(...coordinate1);
            let min1 = Math.min(...coordinate1);
            let max2 = Math.max(...coordinate2);
            let min2 = Math.min(...coordinate2);
            this.mapCenterLat = (max2 + min2) / 2;
            this.mapCenterLng = (max1 + min1) / 2;
        }
    }

    handleOver(index: number) {
        this.overIndex = index;
        this.hover = true;
    }

    handleLeave(index: number) {
        this.hover = false;
    }

    async loadUserSubscribe() {
        let resp = await Utils.doGet(this, '/api/sessions/fleet', this.cancelAPI);
        if (resp.success) {
            this.subscribeInfo = resp.data;
        } else {
            Utils.showWarning(String(this.formatMess(resp.code)));
        }
    }

    async mounted() {
        this.vm = new Vue();
        this.loadUserSubscribe();
        this.loadTime();
        this.loadMomentTime();
        let cameraSn = this.$route.query.cameraSn;
        if (cameraSn) {
            this.handleRoutePush();
        } else {
            this.loadData();
        }
        let _this = this;
        (window as any).handlePlayVideo = _this.handlePlayVideo;
        (window as any).testScrollToTrip = _this.testScrollToTrip;
        (window as any).forceScrollToTrip = _this.forceScrollToTrip;
        (window as any).debugElements = () => {
            console.log('=== DOM Debug ===');
            console.log('Collapse items:', document.querySelectorAll('.el-collapse-item'));
            console.log('Items with data-trip-index:', document.querySelectorAll('[data-trip-index]'));
            console.log('detaillist container:', document.querySelector('.detaillist'));
            console.log('tripData length:', _this.tripData ? _this.tripData.length : 'null');
            console.log('Current collapseNames:', _this.collapseNames);
            console.log('Current cllapseVal:', _this.cllapseVal);
        };
        (window as any).simpleScrollTest = () => {
            console.log('=== Simple Scroll Test ===');
            window.scrollTo({ top: 500, behavior: 'smooth' });
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 2000);
        };
        (window as any).forceScrollNow = (index: number) => {
            console.log('=== FORCE SCROLL NOW - Index:', index, '===');
            const items = document.querySelectorAll('.el-collapse-item');
            console.log('Found items:', items.length);
            if (items[index]) {
                const element = items[index];
                console.log('Scrolling to element:', element);
                
                // Force immediate scroll
                const rect = element.getBoundingClientRect();
                const scrollTop = window.pageYOffset + rect.top - 100;
                console.log('Current scroll:', window.pageYOffset, 'Target scroll:', scrollTop);
                
                window.scrollTo({ top: scrollTop, behavior: 'smooth' });
                
                // Also try scrollIntoView
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                console.log('Scroll commands executed');
            } else {
                console.log('Element not found at index:', index);
            }
        };
    }

    async beforeUnmount() {
        alert(123)
        for (let i = this.idSetTimerout; i >= 0; i--) {
            window.clearTimeout(this.idSetTimerout)
        }
    }

    loadMomentTime() {
        this.queryForm.searchDate = this.vm.$moment().format('YYYY-MM-DD');
        this.tripQueryForm.searchDate = this.queryForm.searchDate;
        this.detailQueryForm.searchStartDate = this.queryForm.searchDate;
        this.detailQueryForm.searchEndDate = this.queryForm.searchDate;
        this.timeValue = [this.queryForm.searchDate, this.queryForm.searchDate];
    }

    async handleRoutePush() {
        let cameraSn = this.$route.query.cameraSn;
        this.detailPlateNo = this.$route.query.plateNo;
        let time = this.$route.query.time;
        this.needShowPlate = true;
        if (cameraSn) {
            if (time) {
                let fomatTime = this.defaultYdayValue(time);
                this.timeDay = fomatTime;
                this.timeValue = [fomatTime, fomatTime];
                this.queryForm.searchDate = fomatTime;
                this.tripQueryForm.searchDate = fomatTime;
                this.detailQueryForm.searchStartDate = fomatTime;
                this.detailQueryForm.searchEndDate = fomatTime;
            }
            this.detailName = 'Trip';
            this.isDetail = true;
            await this.handleTripDetail(cameraSn, 1);
        }
    }
    async handleBack() {
        let newQuery = JSON.parse(JSON.stringify(this.$route.query));
        if (JSON.stringify(newQuery) !== '{}') {
            delete newQuery.cameraSn;
            delete newQuery.plateNo;
            delete newQuery.time;
            delete newQuery.tripId;
            delete newQuery.autoSelect;
            delete newQuery.scrollToTrip;
            this.$router.replace({ query: newQuery });
        }
        this.isDetail = false;
        this.timeDay = '';
        this.cardetailDio = false;
        this.needShowPlate = false;
        this.loadMomentTime();
        this.loadData();
    }

    async handleDetailChange() {
        if (this.detailName === 'Event') {
            this.handleOneDetail(this.cameraSn);
            this.locations = [];
        } else if (this.detailName === 'Trip') {
            this.tripQueryForm.searchDate = this.queryForm.searchDate;
            this.handleTripDetail(this.cameraSn, 1);
        }
    }

    loadTime() {
        this.baseTime = this.vm.$moment().format('DD-MM-YYYY');
        this.baseTimeHour = this.vm.$moment().format("HH:mm");
        this.idSetTimerout = setTimeout(() => {
            this.loadTime();
        }, 6000);
    }

    countDown() {
        if (!this.canClick) return;
        this.canClick = false;
        this.countContent = this.totalTime + 's ' + this.t('后结束');
        this.clock = window.setInterval(() => {
            this.totalTime--;
            this.countContent = this.totalTime + 's ' + this.t('后结束');
            if (this.totalTime < 0) {
                this.countContent = this.t('重新唤醒');
                window.clearInterval(this.clock);
                this.totalTime = 120;
                this.canClick = true;
                this.liveData.liveStatus = '';
                this.onPlayerEnded(this.videoEvent, false);
                this.destoryVideo();
            }
        }, 1000);
    }

    handleRefresh() {
        this.liveDio = false;
        this.wakeupFail = false;
        this.handlePlayLive(this.itemData);
    }

    async handlePlayLive(item: any) {
        this.isOffline = false;
        this.needclose = false;
        this.liveDio = true;
        this.waitloading = true;
        this.itemData = item;
        this.playerOptions.sources[0].src = '';
        let resp = await Utils.doGet(this, `/api/admin/fleet-view/${item.cameraSn}/start-live`, this.cancelAPI);
        if (resp.success) {
            this.liveData.liveStatus = resp.data.status;
            if (this.liveData.liveStatus === 'offline') {
                Utils.showWarning(this.t('设备已离线。'));
                this.waitloading = false;
                this.loading = false;
                this.isOffline = true;
            } else {
                if (!this.needclose) {
                    this.loadLive(this.itemData);
                }
            }
        } else {
            Utils.showWarning(this.formatMess(resp.code));
            this.waitloading = false;
            this.liveDio = false;
            this.loading = false;

        }
    }
    async loadLive(item: any) {
        this.timer = '';
        clearTimeout(this.timer);
        let res = await Utils.doGet(this, `/api/admin/fleet-view/${item.cameraSn}/live-status`, this.cancelAPI);
        if (res.success) {
            this.waitloading = true;
            this.liveData.liveStatus = res.data.status;
            if (this.liveData.liveStatus === 'live') {
                this.playerOptions.sources[0].src = res.data.playUrl;
                this.waitloading = false;
                this.loadUploadStatus();
                this.totalTime = 120;
                this.countDown();
                clearTimeout(this.timer);
            } else if (this.liveData.liveStatus === 'stopped') {
                this.waitloading = false;
                this.wakeupFail = true;
            } else if (this.liveData.liveStatus === 'waitForPublish' || this.liveData.liveStatus === 'waitForAwake') {
                this.timer = setTimeout(() => {
                    this.loadLive(this.itemData);
                }, 5000);
            }
        } else {
            this.loading = false;
            Utils.showWarning(this.tt('加载数据失败。原因：') + res.message);
        }
    }

    async loadUploadStatus() {
        let resp = await Utils.doGet(this, `/api/admin/fleet-view/${this.itemData.cameraSn}/live/upload-status`, this.cancelAPI);
        if (resp.success) {
            this.kbstatus = (resp.data.bytesInRate / 1000).toFixed(1);
        } else {
            Utils.showWarning(this.formatMess(resp.code));
        }
        if (this.liveData.liveStatus === 'live') {
            this.statustimer = setTimeout(() => {
                if (this.liveDio !== false) {
                    this.loadUploadStatus();
                }
            }, 500);
        } else {
            clearTimeout(this.statustimer);
        }
    }

    unsecuredCopyToClipboard(text: any) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Unable to copy to clipboard', err);
        }
        document.body.removeChild(textArea);
    }

    handleCopyLink() {
        this.unsecuredCopyToClipboard(`${window.location.origin}/#/trippl/${this.tripId}`);
        Utils.showSuccess(this.formatMutilMess('Copy success'));
    }

    initMap(lat: number, lng: number) {
        let map: any;
        let latlng = { lat: lat, lng: lng };
        let myOptions = {
            zoom: 18,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: [
                {
                    featureType: 'administrative',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#444444'
                        }
                    ]
                },
                {
                    featureType: 'administrative.country',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            saturation: '100'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                },
                {
                    featureType: 'administrative.country',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            saturation: '-100'
                        },
                        {
                            visibility: 'off'
                        },
                        {
                            lightness: '-100'
                        },
                        {
                            color: '#ff0000'
                        }
                    ]
                },
                {
                    featureType: 'administrative.country',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#fefefe'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                },
                {
                    featureType: 'administrative.locality',
                    elementType: 'labels.text',
                    stylers: [
                        {
                            saturation: '100'
                        },
                        {
                            lightness: '100'
                        },
                        {
                            weight: '0.01'
                        }
                    ]
                },
                {
                    featureType: 'administrative.locality',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            lightness: '-87'
                        },
                        {
                            saturation: '-100'
                        },
                        {
                            hue: '#ff0079'
                        }
                    ]
                },
                {
                    featureType: 'administrative.locality',
                    elementType: 'labels.text.stroke',
                    stylers: [
                        {
                            saturation: '-100'
                        },
                        {
                            lightness: '-100'
                        },
                        {
                            gamma: '3.06'
                        }
                    ]
                },
                {
                    featureType: 'landscape',
                    elementType: 'all',
                    stylers: [
                        {
                            color: '#f2f2f2'
                        }
                    ]
                },
                {
                    featureType: 'poi',
                    elementType: 'all',
                    stylers: [
                        {
                            visibility: 'off'
                        }
                    ]
                },
                {
                    featureType: 'poi.attraction',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            color: '#dddddd'
                        }
                    ]
                },
                {
                    featureType: 'poi.attraction',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#c90a0a'
                        }
                    ]
                },
                {
                    featureType: 'poi.government',
                    elementType: 'geometry',
                    stylers: [
                        {
                            color: '#c23232'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                },
                {
                    featureType: 'poi.park',
                    elementType: 'geometry',
                    stylers: [
                        {
                            color: '#b60202'
                        }
                    ]
                },
                {
                    featureType: 'poi.place_of_worship',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#b20a0a'
                        }
                    ]
                },
                {
                    featureType: 'poi.place_of_worship',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            visibility: 'on'
                        },
                        {
                            color: '#b20000'
                        }
                    ]
                },
                {
                    featureType: 'poi.sports_complex',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#160101'
                        }
                    ]
                },
                {
                    featureType: 'road',
                    elementType: 'all',
                    stylers: [
                        {
                            saturation: -100
                        },
                        {
                            lightness: 45
                        }
                    ]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'all',
                    stylers: [
                        {
                            visibility: 'simplified'
                        }
                    ]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            color: '#acaaaa'
                        }
                    ]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'labels.text.stroke',
                    stylers: [
                        {
                            visibility: 'on'
                        },
                        {
                            color: '#625d5d'
                        }
                    ]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            weight: '0.01'
                        }
                    ]
                },
                {
                    featureType: 'road.highway.controlled_access',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            color: '#f6d467'
                        }
                    ]
                },
                {
                    featureType: 'road.highway.controlled_access',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#000000'
                        }
                    ]
                },
                {
                    featureType: 'road.highway.controlled_access',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            lightness: '-2'
                        },
                        {
                            saturation: '-11'
                        },
                        {
                            gamma: '1.95'
                        }
                    ]
                },
                {
                    featureType: 'road.arterial',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            visibility: 'off'
                        }
                    ]
                },
                {
                    featureType: 'transit',
                    elementType: 'all',
                    stylers: [
                        {
                            visibility: 'off'
                        }
                    ]
                },
                {
                    featureType: 'transit.station.bus',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#d35252'
                        }
                    ]
                },
                {
                    featureType: 'transit.station.bus',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#81efdd'
                        }
                    ]
                },
                {
                    featureType: 'water',
                    elementType: 'all',
                    stylers: [
                        {
                            color: '#e7e7e7'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                },
                {
                    featureType: 'water',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            color: '#c6e6f0'
                        }
                    ]
                },
                {
                    featureType: 'water',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#bcadad'
                        }
                    ]
                },
                {
                    featureType: 'water',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#e9ecf3'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                }
            ],
        };

        map = new google.maps.Map(document.getElementById('map'), myOptions);
        const beachMarker = new google.maps.Marker({
            position: { lat: lat, lng: lng },
            map,
            icon: 'https://data.waylens.com/d602e1e6c7b61706942990ff1dd6a7be.svg'
        });
    }

    handleShowLocation(item: any) {
        if (item.gpsData.coordinate[0] && item.gpsData.coordinate[1]) {
            setTimeout(() => {
                this.initMap(item.gpsData.coordinate[1], item.gpsData.coordinate[0]);
            }, 500);
        }
    }

    async handleDetailClickCar(cameraSn: any, detailPlateNo: string, driverName: string, item: any) {
        if (item.mode === 'driving') {
            let plateNo = this.$route.query.plateNo;
            this.driverName = driverName;
            this.detailPlateNo = plateNo || detailPlateNo || this.detailPlateNo;
            this.cardetailDio = false;
            this.detailName = 'Trip';
            this.isDetail = true;
            this.needShowPlate = true;
            this.cameraSn = cameraSn;
            this.handleTripDetail(cameraSn, 1)
            this.dataDetailMap = item
        }
        else if (item.mode === 'parking') {
            this.handleShowLocation(item)
        }

    }

    async handleDetailClick(cameraSn: any, detailPlateNo: string, driverName: string, item: any) {
        let plateNo = this.$route.query.plateNo;
        this.trackloading = true;
        this.driverName = driverName;
        this.detailPlateNo = plateNo || detailPlateNo || this.detailPlateNo;
        this.cardetailDio = false;
        this.detailName = 'Trip';
        this.isDetail = true;
        this.needShowPlate = true;
        this.cameraSn = cameraSn;
        this.handleTripDetail(cameraSn, 1)
        this.dataDetailMap = item
    }

    async handleOneDetail(cameraSn: any) {
        this.cameraSn = cameraSn;
        let test: any = [];
        this.timeDay = this.queryForm.searchDate;
        this.loading = true;
        this.trackloading = true;
        let params = Utils.queryFormWrapper(this.detailQueryForm);
        let resp = await Utils.doGet(this, `/api/admin/fleet-view/${this.cameraSn}/events?${params}`, this.cancelAPI);
        if (resp.success) {
            this.isDetail = true;
            this.eventsData = resp.data;
            this.trackloading = false;
            this.eventsData.forEach((item: any) => {
                item.startTime = this.defaultYdayValue(item.startTime);
            });
            let b = this.eventsData.reduce((r: any, x: any) => ((r[x.startTime] || (r[x.startTime] = [])).push(x), r), {});
            this.timeEventList = Object.keys(b).map(x => b[x]);
            test = this.timeEventList
            for (let index of test) {

            }
            this.timeEventListCV = test
            this.loadPointMapCenter(this.eventsData, 'points');
            this.loading = false;
        } else {
            this.trackloading = false;
            this.loading = false;
            Utils.showWarning(this.formatMess(resp.code));
        }
        this.eventListMap();
    }

    handleCVEvent(data: any) {
        let newData = ''
        if (data === 'FORWARD_COLLISION_WARNING') {
            newData = this.t('FORWARD_COLLISION_WARNING');
        }
        if (data === 'HEADWAY_MONITORING_WARNING') {
            newData = this.t('HEADWAY_MONITORING_WARNING');
        }
        if (data === 'HEADWAY_MONITORING_EMERGENCY') {
            newData = this.t('HEADWAY_MONITORING_EMERGENCY');
        }
        if (data === 'NO_DRIVER') {
            newData = this.t('NO_DRIVER');
        }
        if (data === 'ASLEEP') {
            newData = this.t('ASLEEP');
        }
        if (data === 'DROWSINESS') {
            newData = this.t('DROWSINESS');
        }
        if (data === 'YAWN') {
            newData = this.t('YAWN');
        } if (data === 'DAYDREAMING') {
            newData = this.t('DAYDREAMING');
        } if (data === 'USING_PHONE') {
            newData = this.t('USING_PHONE');
        } if (data === 'DISTRACTED') {
            newData = this.t('DISTRACTED');
        }
        if (data === 'SMOKING') {
            newData = this.t('SMOKING');
        }
        if (data === 'NO_SEATBELT') {
            newData = this.t('NO_SEATBELT');
        }
        if (data === 'DRIVING_HEAVY_HIT') {
            newData = this.t('DRIVING_HEAVY_HIT');
        }
        if (data === 'DRIVING_SUSPICIOUS_HIT') {
            newData = this.t('DRIVING_SUSPICIOUS_HIT');
        }
        if (data === 'DRIVING_LIGHT_HIT') {
            newData = this.t('DRIVING_LIGHT_HIT');
        }
        if (data === 'HARD_ACCEL') {
            newData = this.t('HARD_ACCEL');
        }
        if (data === 'HARSH_ACCEL') {
            newData = this.t('HARSH_ACCEL');
        }
        if (data === 'SEVERE_ACCEL') {
            newData = this.t('SEVERE_ACCEL');
        }
        if (data === 'HARD_BRAKE') {
            newData = this.t('HARD_BRAKE');
        }
        if (data === 'HARSH_BRAKE') {
            newData = this.t('HARSH_BRAKE');
        }
        if (data === 'SEVERE_BRAKE') {
            newData = this.t('SEVERE_BRAKE');
        }
        if (data === 'SHARP_TURN') {
            newData = this.t('SHARP_TURN');
        }
        if (data === 'HARSH_TURN') {
            newData = this.t('HARSH_TURN');
        }
        if (data === 'SEVERE_TURN') {
            newData = this.t('SEVERE_TURN');
        }
        if (data === 'FORWARD_COLLISION_WARNING') {
            newData = this.t('FORWARD_COLLISION_WARNING');
        }
        if (data === 'PARKING_HIT') {
            newData = this.t('PARKING_HIT');
        }
        if (data === 'PARKING_HEAVY_HIT') {
            newData = this.t('PARKING_HEAVY_HIT');
        }
        if (data === 'POWER_LOST') {
            newData = this.t('POWER_LOST');
        }
        return newData
    }

    handleFilter() {
        if (this.dataFilter === false) {
            let newData = this.tripData.filter((item: any) => item.hours >= 0.084);
            this.tripData = newData;
            this.dataFilter = !this.dataFilter;
        }
        else {
            this.tripData = this.OriginData;
            this.dataFilter = !this.dataFilter;
        }
    }

    async handleTripTitleClick(tripId: any, item?: any) {
        this.tripId = tripId;
        this.clickIndex = 0;
        this.carDriving = item.parkingTime === null;
        if (tripId) {
            this.trackloading = true;
            this.loading = true;
            let resp = await Utils.doGet(this, `/api/admin/fleet-view/trip/${tripId}/events`, this.cancelAPI);
            if (resp.success) {
                this.loading = false;
                this.trackloading = false;
                this.tripEventData = resp.data;
            } else {
                this.loading = false;
                this.trackloading = false;
                Utils.showWarning(this.formatMess(resp.code));
            }
        }
        if (item) {
            this.loadTripLine(item);
        }
    }
    async handleTripDetail(cameraSn: any, showTrip?: number) {
        this.cameraSn = cameraSn;
        this.loading = true;
        this.collapseNames = 1;
        this.cllapseVal = 1;
        let resp = await Utils.doGet(this, `/api/admin/fleet-view/${this.cameraSn}/trips?searchDate=${this.tripQueryForm.searchDate}`, this.cancelAPI);
        if (resp.success) {
            this.tripData = resp.data;
            this.OriginData = resp.data;
            let hours = 0;
            let miles = 0;
            let eventCount = 0;

            this.tripData.forEach((item: any) => {
                hours = hours + item.hours;
                miles = miles + item.distance;
                eventCount = eventCount + item.eventCount;
                if (item.parkingTime) {
                    item.timeInterval = this.vm.$moment(item.parkingTime).diff(this.vm.$moment(item.drivingTime), 'minutes');
                } else {
                    let nowmoment: any = this.vm.$moment().format('YYYY-MM-DDTHH:mm:ss');
                    item.timeInterval = this.vm.$moment(nowmoment).diff(this.vm.$moment(item.drivingTime), 'minutes');
                }
            });
            this.totalHours = this.formatHour(this.numberValue(hours));
            this.totalMiles = this.numberValue(miles);
            this.totalEventCount = eventCount;

            if (this.tripData !== undefined && this.tripData.length > 0) {
                this.tripGpsData = this.tripData[0].gpsDataList;
            } else {
                this.tripGpsData = [];
                this.loadTripLine({});
            }
            this.cardetailDio = !showTrip;
            if (this.tripData[0]) {
                this.handleTripTitleClick(this.tripData[0].tripId, this.tripData[0]);
            }
            this.trackloading = false;
            this.loading = false;
            
            // Handle auto-select and scroll after data is loaded
            this.handleAutoSelectAndScroll();
        } else {
            this.trackloading = false;
            this.loading = false;
            Utils.showWarning(this.formatMess(resp.code));
        }
    }
    
    // Method to handle auto-select and scroll after data is loaded
    handleAutoSelectAndScroll() {
        const tripId = this.$route.query.tripId;
        const autoSelect = this.$route.query.autoSelect;
        const scrollToTrip = this.$route.query.scrollToTrip;
        
        console.log('=== handleAutoSelectAndScroll START ===');
        console.log('Query params:', { tripId, autoSelect, scrollToTrip });
        console.log('TripData available:', this.tripData ? this.tripData.length : 'null');
        
        if (autoSelect === 'true' && tripId && this.tripData && this.tripData.length > 0) {
            // Convert tripId to string for comparison
            const targetTripId = String(tripId);
            const targetIndex = this.tripData.findIndex((trip: any) => String(trip.tripId) === targetTripId);
            console.log('Found target trip at index:', targetIndex, 'for tripId:', targetTripId);
            
            if (targetIndex !== -1) {
                // Select the collapse item
                this.collapseNames = targetIndex + 1;
                this.cllapseVal = targetIndex + 1;
                console.log('Set collapse selection:', this.collapseNames);
                
                // Load the trip details
                this.handleTripTitleClick(targetTripId, this.tripData[targetIndex]);
                
                // Force scroll immediately and with retries
                if (scrollToTrip === 'true') {
                    console.log('Starting scroll sequence...');
                    
                    // Immediate scroll attempt
                    this.forceScrollToTrip(targetIndex);
                    
                    // Delayed retries
                    this.$nextTick(() => {
                        setTimeout(() => this.forceScrollToTrip(targetIndex), 100);
                        setTimeout(() => this.forceScrollToTrip(targetIndex), 500);
                        setTimeout(() => this.forceScrollToTrip(targetIndex), 1000);
                        setTimeout(() => this.forceScrollToTrip(targetIndex), 2000);
                    });
                }
            } else {
                console.log('Trip NOT FOUND:', targetTripId);
                console.log('Available trips:', this.tripData.map((t: any) => ({ id: t.id, tripId: t.tripId })));
            }
        } else {
            console.log('Auto-select conditions not met:', {
                autoSelectTrue: autoSelect === 'true',
                hasTripId: !!tripId,
                hasTripData: !!(this.tripData && this.tripData.length > 0)
            });
        }
        console.log('=== handleAutoSelectAndScroll END ===');
    }
    
    // Force scroll to specific trip with multiple methods
    forceScrollToTrip(targetIndex: number) {
        console.log(`\n=== FORCE SCROLL ATTEMPT - Index: ${targetIndex} ===`);
        
        // Log current DOM state
        const allCollapseItems = document.querySelectorAll('.el-collapse-item');
        console.log('Total collapse items in DOM:', allCollapseItems.length);
        console.log('Target index:', targetIndex);
        
        let scrolled = false;
        
        // Method 1: Direct array access
        if (allCollapseItems[targetIndex]) {
            const targetElement = allCollapseItems[targetIndex];
            console.log('Method 1 - Found element by index:', targetElement);
            
            // Get element position
            const rect = targetElement.getBoundingClientRect();
            const scrollTop = window.pageYOffset + rect.top - 150; // 150px offset from top
            
            console.log('Element position:', { rect, scrollTop, currentScroll: window.pageYOffset });
            
            // Force scroll with window.scrollTo
            window.scrollTo({
                top: scrollTop,
                behavior: 'smooth'
            });
            
            // Also try scrollIntoView as backup
            targetElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
            });
            
            scrolled = true;
            console.log('✅ Scrolled using Method 1');
        }
        
        // Method 2: Find by data attribute
        if (!scrolled) {
            const elementByData = document.querySelector(`[data-trip-index="${targetIndex}"]`);
            if (elementByData) {
                console.log('Method 2 - Found by data attribute:', elementByData);
                elementByData.scrollIntoView({ behavior: 'smooth', block: 'center' });
                scrolled = true;
                console.log('✅ Scrolled using Method 2');
            }
        }
        
        // Method 3: Find by trip content
        if (!scrolled && this.tripData[targetIndex]) {
            const tripItem = this.tripData[targetIndex];
            const tripText = `Trip ${tripItem.id}`;
            console.log('Method 3 - Looking for trip text:', tripText);
            
            for (let i = 0; i < allCollapseItems.length; i++) {
                const item = allCollapseItems[i];
                if (item.textContent && item.textContent.includes(tripText)) {
                    console.log('Method 3 - Found by content at index:', i, item);
                    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    scrolled = true;
                    console.log('✅ Scrolled using Method 3');
                    break;
                }
            }
        }
        
        // Method 4: Force scroll to a calculated position
        if (!scrolled) {
            console.log('Method 4 - Fallback position calculation');
            const estimatedPosition = 300 + (targetIndex * 200); // Rough estimate
            window.scrollTo({
                top: estimatedPosition,
                behavior: 'smooth'
            });
            console.log('✅ Scrolled using Method 4 - estimated position:', estimatedPosition);
            scrolled = true;
        }
        
        // Log final status
        console.log('Scroll attempt completed. Success:', scrolled);
        console.log('=== FORCE SCROLL END ===\n');
        
        return scrolled;
    }
    
    async loadTripLine(item: any) {
        this.trackloading = true;
        if (JSON.stringify(item) !== '{}') {
            this.trackloading = true;
            this.locations = [];
            this.result = [];
            let myArr: any = [];
            let resp = await Utils.doGet(this, `/api/admin/fleet-view/${item.cameraSn}/${item.tripId}/track`, this.cancelAPI);
            if (resp.success) {
                this.tripGpsData = resp.data;
                const intervalId = window.setInterval(function () { }, Number.MAX_SAFE_INTEGER);
                for (let i = 1; i < intervalId; i++) {
                    window.clearInterval(i);
                }
                this.tripGpsData.forEach((items: any, index: any) => {
                    if (items) {
                        this.locations.push({ coordiate: `${items.coordinate[1]},${items.coordinate[0]}`, ...items });
                        myArr.push(`${items.coordinate[1]},${items.coordinate[0]}`);
                        if (index === this.tripGpsData.length - 1) {
                            this.result = this.chunkArray(myArr, 100);
                        }
                    }
                });
            } else {
                Utils.showWarning(this.formatMess(resp.code));
            }
            this.loadPointMapCenter(this.tripGpsData, 'line');
            this.tripMap();
            this.trackloading = false;
        } else {
            this.result = [];
            this.locations = [];
            this.tripMap();
        }
    }
    async loadEventVideo(items: any, indexs: number) {
        let myOptions = {
            zoom: 12,
            center: new google.maps.LatLng(this.mapCenterLat, this.mapCenterLng),
            mapTypeControl: true,
            styles: [
                {
                    featureType: 'administrative',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#444444'
                        }
                    ]
                },
                {
                    featureType: 'administrative.country',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            saturation: '100'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                },
                {
                    featureType: 'administrative.country',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            saturation: '-100'
                        },
                        {
                            visibility: 'off'
                        },
                        {
                            lightness: '-100'
                        },
                        {
                            color: '#ff0000'
                        }
                    ]
                },
                {
                    featureType: 'administrative.country',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#fefefe'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                },
                {
                    featureType: 'administrative.locality',
                    elementType: 'labels.text',
                    stylers: [
                        {
                            saturation: '100'
                        },
                        {
                            lightness: '100'
                        },
                        {
                            weight: '0.01'
                        }
                    ]
                },
                {
                    featureType: 'administrative.locality',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            lightness: '-87'
                        },
                        {
                            saturation: '-100'
                        },
                        {
                            hue: '#ff0079'
                        }
                    ]
                },
                {
                    featureType: 'administrative.locality',
                    elementType: 'labels.text.stroke',
                    stylers: [
                        {
                            saturation: '-100'
                        },
                        {
                            lightness: '-100'
                        },
                        {
                            gamma: '3.06'
                        }
                    ]
                },
                {
                    featureType: 'landscape',
                    elementType: 'all',
                    stylers: [
                        {
                            color: '#f2f2f2'
                        }
                    ]
                },
                {
                    featureType: 'poi',
                    elementType: 'all',
                    stylers: [
                        {
                            visibility: 'off'
                        }
                    ]
                },
                {
                    featureType: 'poi.attraction',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            color: '#dddddd'
                        }
                    ]
                },
                {
                    featureType: 'poi.attraction',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#c90a0a'
                        }
                    ]
                },
                {
                    featureType: 'poi.government',
                    elementType: 'geometry',
                    stylers: [
                        {
                            color: '#c23232'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                },
                {
                    featureType: 'poi.park',
                    elementType: 'geometry',
                    stylers: [
                        {
                            color: '#b60202'
                        }
                    ]
                },
                {
                    featureType: 'poi.place_of_worship',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#b20a0a'
                        }
                    ]
                },
                {
                    featureType: 'poi.place_of_worship',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            visibility: 'on'
                        },
                        {
                            color: '#b20000'
                        }
                    ]
                },
                {
                    featureType: 'poi.sports_complex',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#160101'
                        }
                    ]
                },
                {
                    featureType: 'road',
                    elementType: 'all',
                    stylers: [
                        {
                            saturation: -100
                        },
                        {
                            lightness: 45
                        }
                    ]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'all',
                    stylers: [
                        {
                            visibility: 'simplified'
                        }
                    ]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            color: '#acaaaa'
                        }
                    ]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'labels.text.stroke',
                    stylers: [
                        {
                            visibility: 'on'
                        },
                        {
                            color: '#625d5d'
                        }
                    ]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            weight: '0.01'
                        }
                    ]
                },
                {
                    featureType: 'road.highway.controlled_access',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            color: '#f6d467'
                        }
                    ]
                },
                {
                    featureType: 'road.highway.controlled_access',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#000000'
                        }
                    ]
                },
                {
                    featureType: 'road.highway.controlled_access',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            lightness: '-2'
                        },
                        {
                            saturation: '-11'
                        },
                        {
                            gamma: '1.95'
                        }
                    ]
                },
                {
                    featureType: 'road.arterial',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            visibility: 'off'
                        }
                    ]
                },
                {
                    featureType: 'transit',
                    elementType: 'all',
                    stylers: [
                        {
                            visibility: 'off'
                        }
                    ]
                },
                {
                    featureType: 'transit.station.bus',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#d35252'
                        }
                    ]
                },
                {
                    featureType: 'transit.station.bus',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#81efdd'
                        }
                    ]
                },
                {
                    featureType: 'water',
                    elementType: 'all',
                    stylers: [
                        {
                            color: '#e7e7e7'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                },
                {
                    featureType: 'water',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            color: '#c6e6f0'
                        }
                    ]
                },
                {
                    featureType: 'water',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#bcadad'
                        }
                    ]
                },
                {
                    featureType: 'water',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#e9ecf3'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                }
            ],
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        let map = new google.maps.Map(document.getElementById('map'), myOptions);
        this.isActive = indexs;
        this.tripMap(items.id);
        let bounds = new google.maps.LatLngBounds();
        bounds.extend(new google.maps.LatLng(items.gpsLatitude, items.gpsLongitude));
        map.fitBounds(bounds);
        this.handlePlayVideo(items.id, indexs, items.gpsLongitude, items.gpsLatitude)
    }

    animateLine(line: any, tripLane: any) {
        let count = 0;
        window.setInterval(() => {
            count = (count + 1) % 200;
            const icons = line.get('icons');
            icons[0].offset = count / 2 + '%';
            line.set('icons', icons);
        }, 100);
    }

    chunkArray(myArray: any, chunkSize: any) {
        let index = 0;
        let arrayLength = myArray.length;
        let tempArray = [];
        for (index = 0; index < arrayLength; index += chunkSize) {
            const myChunk = myArray.slice(index, index + chunkSize);
            tempArray.push(myChunk);
        }
        return tempArray;
    }

    tripLine(snappedPolyline: any, tripLane: any, indexeventId?: any) {
        let dataLength = 0;
        for (let index = 0; index < this.result.length; index++) {
            dataLength += this.result[index].length;
        }
        const imageIconStart = {
            url: require('../assets/PointsStart.svg'),
            scaledSize: new google.maps.Size(50, 50),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(24, 18)
        };
        const imageIconEnd = {
            url: require('../assets/PointsEnd.svg'),
            scaledSize: new google.maps.Size(50, 50),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(24, 18)
        };
        let myOptions = {
            zoom: dataLength < 6 ? 18 : dataLength < 23 ? 16 : dataLength < 23 ? 16 : dataLength < 40 ? 14 : dataLength < 100 ? 13 : dataLength < 200 ? 13 : 12, // 缩放级别
            center: new google.maps.LatLng(this.mapCenterLat, this.mapCenterLng),
            mapTypeControl: true,
            styles: [
                {
                    featureType: 'administrative',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#444444'
                        }
                    ]
                },
                {
                    featureType: 'administrative.country',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            saturation: '100'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                },
                {
                    featureType: 'administrative.country',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            saturation: '-100'
                        },
                        {
                            visibility: 'off'
                        },
                        {
                            lightness: '-100'
                        },
                        {
                            color: '#ff0000'
                        }
                    ]
                },
                {
                    featureType: 'administrative.country',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#fefefe'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                },
                {
                    featureType: 'administrative.locality',
                    elementType: 'labels.text',
                    stylers: [
                        {
                            saturation: '100'
                        },
                        {
                            lightness: '100'
                        },
                        {
                            weight: '0.01'
                        }
                    ]
                },
                {
                    featureType: 'administrative.locality',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            lightness: '-87'
                        },
                        {
                            saturation: '-100'
                        },
                        {
                            hue: '#ff0079'
                        }
                    ]
                },
                {
                    featureType: 'administrative.locality',
                    elementType: 'labels.text.stroke',
                    stylers: [
                        {
                            saturation: '-100'
                        },
                        {
                            lightness: '-100'
                        },
                        {
                            gamma: '3.06'
                        }
                    ]
                },
                {
                    featureType: 'landscape',
                    elementType: 'all',
                    stylers: [
                        {
                            color: '#f2f2f2'
                        }
                    ]
                },
                {
                    featureType: 'poi',
                    elementType: 'all',
                    stylers: [
                        {
                            visibility: 'off'
                        }
                    ]
                },
                {
                    featureType: 'poi.attraction',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            color: '#dddddd'
                        }
                    ]
                },
                {
                    featureType: 'poi.attraction',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#c90a0a'
                        }
                    ]
                },
                {
                    featureType: 'poi.government',
                    elementType: 'geometry',
                    stylers: [
                        {
                            color: '#c23232'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                },
                {
                    featureType: 'poi.park',
                    elementType: 'geometry',
                    stylers: [
                        {
                            color: '#b60202'
                        }
                    ]
                },
                {
                    featureType: 'poi.place_of_worship',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#b20a0a'
                        }
                    ]
                },
                {
                    featureType: 'poi.place_of_worship',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            visibility: 'on'
                        },
                        {
                            color: '#b20000'
                        }
                    ]
                },
                {
                    featureType: 'poi.sports_complex',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#160101'
                        }
                    ]
                },
                {
                    featureType: 'road',
                    elementType: 'all',
                    stylers: [
                        {
                            saturation: -100
                        },
                        {
                            lightness: 45
                        }
                    ]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'all',
                    stylers: [
                        {
                            visibility: 'simplified'
                        }
                    ]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            color: '#acaaaa'
                        }
                    ]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'labels.text.stroke',
                    stylers: [
                        {
                            visibility: 'on'
                        },
                        {
                            color: '#625d5d'
                        }
                    ]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            weight: '0.01'
                        }
                    ]
                },
                {
                    featureType: 'road.highway.controlled_access',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            color: '#f6d467'
                        }
                    ]
                },
                {
                    featureType: 'road.highway.controlled_access',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#000000'
                        }
                    ]
                },
                {
                    featureType: 'road.highway.controlled_access',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            lightness: '-2'
                        },
                        {
                            saturation: '-11'
                        },
                        {
                            gamma: '1.95'
                        }
                    ]
                },
                {
                    featureType: 'road.arterial',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            visibility: 'off'
                        }
                    ]
                },
                {
                    featureType: 'transit',
                    elementType: 'all',
                    stylers: [
                        {
                            visibility: 'off'
                        }
                    ]
                },
                {
                    featureType: 'transit.station.bus',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#d35252'
                        }
                    ]
                },
                {
                    featureType: 'transit.station.bus',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#81efdd'
                        }
                    ]
                },
                {
                    featureType: 'water',
                    elementType: 'all',
                    stylers: [
                        {
                            color: '#e7e7e7'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                },
                {
                    featureType: 'water',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            color: '#c6e6f0'
                        }
                    ]
                },
                {
                    featureType: 'water',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#bcadad'
                        }
                    ]
                },
                {
                    featureType: 'water',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#e9ecf3'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                }
            ],
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        let map = new google.maps.Map(document.getElementById('map'), myOptions);
        this.linePolyline.push(snappedPolyline);
        const marker = new google.maps.Marker({
            position: new google.maps.LatLng(tripLane[0].lat, tripLane[0].long),
            map: map,
            icon: imageIconStart
        });
        const marker2 = new google.maps.Marker({
            position: new google.maps.LatLng(tripLane[tripLane.length - 1].lat, tripLane[tripLane.length - 1].long),
            map: map,
            icon: this.carDriving === true ? this.bulecar : imageIconEnd
        });
        let infowindow = new google.maps.InfoWindow({
            content: ''
        });

        let bounds = new google.maps.LatLngBounds();
        if (tripLane.length > 0) {
            let bounds = new google.maps.LatLngBounds();
            for (let i = 0; i < tripLane.length; i++) {
                bounds.extend(new google.maps.LatLng(tripLane[i].lat, tripLane[i].long));
            }
            map.fitBounds(bounds);
        }

        if (this.tripEventData.length > 0) {
            let finalArr = [];
            for (let i = 0; i < this.tripGpsData.length; i++) {
                let result = (this.tripGpsData[i].coordinate[0]);
                finalArr.push(result);
            }
            for (let i = 0; i < this.tripEventData.length; i++) {
                const marker = new google.maps.Marker({
                    position: new google.maps.LatLng(this.tripEventData[i].gpsLatitude, this.tripEventData[i].gpsLongitude),
                    map: map,
                    icon: this.tripEventData[i].eventType === 'FORWARD_COLLISION_WARNING' ? this.Icon.FORWARD_COLLISION_WARNING :
                        this.tripEventData[i].eventType === 'SEVERE_TURN' ? this.Icon.SEVERE_TURN :
                            this.tripEventData[i].eventType === 'HARSH_TURN' ? this.Icon.SEVERE_TURN :
                                this.tripEventData[i].eventType === 'SHARP_TURN' ? this.Icon.SEVERE_TURN :
                                    this.tripEventData[i].eventType === 'SEVERE_BRAKE' ? this.Icon.HARSH_BRAKE :
                                        this.tripEventData[i].eventType === 'HARSH_BRAKE' ? this.Icon.HARSH_BRAKE :
                                            this.tripEventData[i].eventType === 'HARD_BRAKE' ? this.Icon.HARSH_BRAKE :
                                                this.tripEventData[i].eventType === 'SEVERE_ACCEL' ? this.Icon.HARSH_ACCEL :
                                                    this.tripEventData[i].eventType === 'HARSH_ACCEL' ? this.Icon.HARSH_ACCEL :
                                                        this.tripEventData[i].eventType === 'HARD_ACCEL' ? this.Icon.HARSH_ACCEL :
                                                            this.tripEventData[i].eventType === 'DRIVING_HEAVY_HIT' ? this.Icon.DRIVING_HEAVY_HIT :
                                                                this.tripEventData[i].eventType === 'DRIVING_SUSPICIOUS_HIT' ? this.Icon.DRIVING_HEAVY_HIT :
                                                                    this.tripEventData[i].eventType === 'DRIVING_LIGHT_HIT' ? this.Icon.DRIVING_HEAVY_HIT :
                                                                        this.tripEventData[i].eventType === 'PARKING_HIT' ? this.Icon.PARKING_HIT :
                                                                            this.tripEventData[i].eventType === 'PARKING_HEAVY_HIT' ? this.Icon.PARKING_HIT :
                                                                                this.tripEventData[i].eventType === 'NO_DRIVER' ? this.Icon.NO_DRIVER :
                                                                                    this.tripEventData[i].eventType === 'ASLEEP' ? this.Icon.ASLEEP :
                                                                                        this.tripEventData[i].eventType === 'DROWSINESS' ? this.Icon.DROWSINESS :
                                                                                            this.tripEventData[i].eventType === 'YAWN' ? this.Icon.YAWN :
                                                                                                this.tripEventData[i].eventType === 'DAYDREAMING' ? this.Icon.DAYDREAMING :
                                                                                                    this.tripEventData[i].eventType === 'USING_PHONE' ? this.Icon.USING_PHONE :
                                                                                                        this.tripEventData[i].eventType === 'DISTRACTED' ? this.Icon.DISTRACTED :
                                                                                                            this.tripEventData[i].eventType === 'SMOKING' ? this.Icon.SMOKING :
                                                                                                                this.tripEventData[i].eventType === 'NO_SEATBELT' ? this.Icon.NO_SEATBELT : this.eventicon
                });
                marker.addListener('mouseover', () => {
                    infowindow.setContent(
                        `<div id='infowindows${i}'>` +
                        `<div class='leftBar'>` +
                        `</div style='display: flex'>` +
                        `</div>` +
                        `<div  style='display: flex'>` +
                        `<div class='content'>` +
                        `<div class='type' style='margin-bottom: 5px;color:#1B1D1F;font-size: 16px;font-weight: 600'>${this.handleCVEvent(this.tripEventData[i].eventType)}</div>` +
                        `<div style='color: #898F96;font-size:16px;' class='time'>${Utils.formatDateStringVN(this.tripEventData[i].time)}</div>` +
                        `<div style='color: #898F96;font-size:16px;font-weight: 600;display: flex' class='time'>${Utils.formatDateStringVN(this.tripEventData[i].gpsTime ? this.tripEventData[i].gpsTime : this.tripEventData[i].createTime).split(" ")[0]}<div style='color: #898F96;font-size:12px;font-weight: 400;margin-left: 6px;margin-top: 3px'>${Utils.formatDateStringVN(this.tripEventData[i].gpsTime ? this.tripEventData[i].gpsTime : this.tripEventData[i].createTime).split(" ")[1]}</div></div>` +
                        `<div style='display:flex;align-items: center'>` +
                        `<div class='duration' style='align-items: center;color: #8301A3;margin-top: 4px'>${this.t('VIDEO_LENGTH')} ${this.tripEventData[i].duration / 1000} ${this.t('second')}</div>` +
                        `<div > ` +
                        `</div>` +
                        '</div>' +
                        '</div>' +
                        `<svg onclick=handlePlayVideo(${this.tripEventData[i].id},${this.tripEventData[i].id},${this.tripEventData[i].gpsLongitude},${this.tripEventData[i].gpsLatitude}) style='cursor: pointer;margin-left: 10px;margin-right: 5px;' width="60" height="60" viewBox="0 0 86 86" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g filter="url(#filter0_d_590_5466)">
                                <g filter="url(#filter1_i_590_5466)">
                                <path d="M71.327 37.9435C71.327 42.1444 70.4995 46.3043 68.8919 50.1854C67.2843 54.0666 64.9279 57.5932 61.9574 60.5637C58.9868 63.5342 55.4603 65.8906 51.5791 67.4982C47.6979 69.1059 43.5381 69.9333 39.3371 69.9333C35.1362 69.9333 30.9763 69.1059 27.0951 67.4982C23.214 65.8906 19.6874 63.5342 16.7169 60.5637C13.7464 57.5932 11.39 54.0666 9.78237 50.1854C8.17473 46.3043 7.34729 42.1444 7.34729 37.9435C7.34729 29.4592 10.7176 21.3225 16.7169 15.3232C22.7162 9.32396 30.8529 5.95361 39.3371 5.95361C47.8214 5.95361 55.9581 9.32396 61.9574 15.3232C67.9566 21.3225 71.327 29.4592 71.327 37.9435Z" fill="#D8F1FF"/>
                                </g>
                                <path d="M71.327 37.9435C71.327 42.1444 70.4995 46.3043 68.8919 50.1854C67.2843 54.0666 64.9279 57.5932 61.9574 60.5637C58.9868 63.5342 55.4603 65.8906 51.5791 67.4982C47.6979 69.1059 43.5381 69.9333 39.3371 69.9333C35.1362 69.9333 30.9763 69.1059 27.0951 67.4982C23.214 65.8906 19.6874 63.5342 16.7169 60.5637C13.7464 57.5932 11.39 54.0666 9.78237 50.1854C8.17473 46.3043 7.34729 42.1444 7.34729 37.9435C7.34729 29.4592 10.7176 21.3225 16.7169 15.3232C22.7162 9.32396 30.8529 5.95361 39.3371 5.95361C47.8214 5.95361 55.9581 9.32396 61.9574 15.3232C67.9566 21.3225 71.327 29.4592 71.327 37.9435Z" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
                                <g filter="url(#filter2_i_590_5466)">
                                <path d="M53.2351 36.7776C53.4432 36.8929 53.6167 37.0618 53.7375 37.2669C53.8582 37.4719 53.9219 37.7055 53.9219 37.9434C53.9219 38.1814 53.8582 38.415 53.7375 38.62C53.6167 38.825 53.4432 38.9939 53.2351 39.1093L33.3197 50.1742C33.1167 50.2869 32.8879 50.3446 32.6558 50.3416C32.4237 50.3387 32.1964 50.2751 31.9964 50.1574C31.7964 50.0396 31.6306 49.8716 31.5155 49.6701C31.4003 49.4686 31.3398 49.2405 31.3398 49.0084V26.8785C31.3398 25.8619 32.4311 25.2221 33.3197 25.7162L53.2351 36.7776Z" fill="#146EC1"/>
                                </g>
                                <path d="M53.2351 36.7776C53.4432 36.8929 53.6167 37.0618 53.7375 37.2669C53.8582 37.4719 53.9219 37.7055 53.9219 37.9434C53.9219 38.1814 53.8582 38.415 53.7375 38.62C53.6167 38.825 53.4432 38.9939 53.2351 39.1093L33.3197 50.1742C33.1167 50.2869 32.8879 50.3446 32.6558 50.3416C32.4237 50.3387 32.1964 50.2751 31.9964 50.1574C31.7964 50.0396 31.6306 49.8716 31.5155 49.6701C31.4003 49.4686 31.3398 49.2405 31.3398 49.0084V26.8785C31.3398 25.8619 32.4311 25.2221 33.3197 25.7162L53.2351 36.7776Z" stroke="#D8F1FF" stroke-linecap="round" stroke-linejoin="round"/>
                                </g>
                                <defs>
                                <filter id="filter0_d_590_5466" x="0.84729" y="0.453613" width="84.9797" height="84.9797" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                <feOffset dx="4" dy="5"/>
                                <feGaussianBlur stdDeviation="5"/>
                                <feComposite in2="hardAlpha" operator="out"/>
                                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"/>
                                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_590_5466"/>
                                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_590_5466" result="shape"/>
                                </filter>
                                <filter id="filter1_i_590_5466" x="6.84729" y="5.45361" width="67.9797" height="67.9797" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                <feOffset dx="3" dy="3"/>
                                <feGaussianBlur stdDeviation="2"/>
                                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                                <feColorMatrix type="matrix" values="0 0 0 0 0.0275069 0 0 0 0 0.04194 0 0 0 0 0.388333 0 0 0 0.15 0"/>
                                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_590_5466"/>
                                </filter>
                                <filter id="filter2_i_590_5466" x="30.8398" y="25.0452" width="25.582" height="27.7966" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                <feOffset dx="2" dy="2"/>
                                <feGaussianBlur stdDeviation="1.5"/>
                                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.34 0"/>
                                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_590_5466"/>
                                </filter>
                                </defs>
                                </svg> ` +
                        `</div>` +
                        `</div>`
                    );
                    infowindow.open({
                        anchor: marker,
                        map,
                        shouldFocus: true
                    });
                });

                marker.addListener('click', () => {
                    infowindow.setContent(
                        `<div id='infowindows${i}'>` +
                        `<div class='leftBar'>` +
                        `</div style='display: flex'>` +
                        `</div>` +
                        `<div  style='display: flex'>` +
                        `<div class='content'>` +
                        `<div class='type' style='margin-bottom: 5px;color:#1B1D1F;font-size: 16px;font-weight: 600'>${this.handleCVEvent(this.tripEventData[i].eventType)}</div>` +
                        `<div style='color: #898F96;font-size:16px;' class='time'>${Utils.formatDateStringVN(this.tripEventData[i].time)}</div>` +
                        `<div style='color: #898F96;font-size:16px;font-weight: 600;display: flex' class='time'>${Utils.formatDateStringVN(this.tripEventData[i].gpsTime ? this.tripEventData[i].gpsTime : this.tripEventData[i].createTime).split(" ")[0]}<div style='color: #898F96;font-size:12px;font-weight: 400;margin-left: 6px;margin-top: 3px'>${Utils.formatDateStringVN(this.tripEventData[i].gpsTime ? this.tripEventData[i].gpsTime : this.tripEventData[i].createTime).split(" ")[1]}</div></div>` +
                        `<div style='display:flex;align-items: center'>` +
                        `<div class='duration' style='align-items: center;color: #8301A3;margin-top: 4px'>${this.t('VIDEO_LENGTH')} ${this.tripEventData[i].duration / 1000} ${this.t('second')}</div>` +
                        `<div > ` +
                        `</div>` +
                        '</div>' +
                        '</div>' +
                        `<svg onclick=handlePlayVideo(${this.tripEventData[i].id},${this.tripEventData[i].id},${this.tripEventData[i].gpsLongitude},${this.tripEventData[i].gpsLatitude}) style='cursor: pointer;margin-left: 10px;margin-right: 5px;' width="60" height="60" viewBox="0 0 86 86" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g filter="url(#filter0_d_590_5466)">
                                <g filter="url(#filter1_i_590_5466)">
                                <path d="M71.327 37.9435C71.327 42.1444 70.4995 46.3043 68.8919 50.1854C67.2843 54.0666 64.9279 57.5932 61.9574 60.5637C58.9868 63.5342 55.4603 65.8906 51.5791 67.4982C47.6979 69.1059 43.5381 69.9333 39.3371 69.9333C35.1362 69.9333 30.9763 69.1059 27.0951 67.4982C23.214 65.8906 19.6874 63.5342 16.7169 60.5637C13.7464 57.5932 11.39 54.0666 9.78237 50.1854C8.17473 46.3043 7.34729 42.1444 7.34729 37.9435C7.34729 29.4592 10.7176 21.3225 16.7169 15.3232C22.7162 9.32396 30.8529 5.95361 39.3371 5.95361C47.8214 5.95361 55.9581 9.32396 61.9574 15.3232C67.9566 21.3225 71.327 29.4592 71.327 37.9435Z" fill="#D8F1FF"/>
                                </g>
                                <path d="M71.327 37.9435C71.327 42.1444 70.4995 46.3043 68.8919 50.1854C67.2843 54.0666 64.9279 57.5932 61.9574 60.5637C58.9868 63.5342 55.4603 65.8906 51.5791 67.4982C47.6979 69.1059 43.5381 69.9333 39.3371 69.9333C35.1362 69.9333 30.9763 69.1059 27.0951 67.4982C23.214 65.8906 19.6874 63.5342 16.7169 60.5637C13.7464 57.5932 11.39 54.0666 9.78237 50.1854C8.17473 46.3043 7.34729 42.1444 7.34729 37.9435C7.34729 29.4592 10.7176 21.3225 16.7169 15.3232C22.7162 9.32396 30.8529 5.95361 39.3371 5.95361C47.8214 5.95361 55.9581 9.32396 61.9574 15.3232C67.9566 21.3225 71.327 29.4592 71.327 37.9435Z" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
                                <g filter="url(#filter2_i_590_5466)">
                                <path d="M53.2351 36.7776C53.4432 36.8929 53.6167 37.0618 53.7375 37.2669C53.8582 37.4719 53.9219 37.7055 53.9219 37.9434C53.9219 38.1814 53.8582 38.415 53.7375 38.62C53.6167 38.825 53.4432 38.9939 53.2351 39.1093L33.3197 50.1742C33.1167 50.2869 32.8879 50.3446 32.6558 50.3416C32.4237 50.3387 32.1964 50.2751 31.9964 50.1574C31.7964 50.0396 31.6306 49.8716 31.5155 49.6701C31.4003 49.4686 31.3398 49.2405 31.3398 49.0084V26.8785C31.3398 25.8619 32.4311 25.2221 33.3197 25.7162L53.2351 36.7776Z" fill="#146EC1"/>
                                </g>
                                <path d="M53.2351 36.7776C53.4432 36.8929 53.6167 37.0618 53.7375 37.2669C53.8582 37.4719 53.9219 37.7055 53.9219 37.9434C53.9219 38.1814 53.8582 38.415 53.7375 38.62C53.6167 38.825 53.4432 38.9939 53.2351 39.1093L33.3197 50.1742C33.1167 50.2869 32.8879 50.3446 32.6558 50.3416C32.4237 50.3387 32.1964 50.2751 31.9964 50.1574C31.7964 50.0396 31.6306 49.8716 31.5155 49.6701C31.4003 49.4686 31.3398 49.2405 31.3398 49.0084V26.8785C31.3398 25.8619 32.4311 25.2221 33.3197 25.7162L53.2351 36.7776Z" stroke="#D8F1FF" stroke-linecap="round" stroke-linejoin="round"/>
                                </g>
                                <defs>
                                <filter id="filter0_d_590_5466" x="0.84729" y="0.453613" width="84.9797" height="84.9797" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                <feOffset dx="4" dy="5"/>
                                <feGaussianBlur stdDeviation="5"/>
                                <feComposite in2="hardAlpha" operator="out"/>
                                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"/>
                                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_590_5466"/>
                                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_590_5466" result="shape"/>
                                </filter>
                                <filter id="filter1_i_590_5466" x="6.84729" y="5.45361" width="67.9797" height="67.9797" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                <feOffset dx="3" dy="3"/>
                                <feGaussianBlur stdDeviation="2"/>
                                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                                <feColorMatrix type="matrix" values="0 0 0 0 0.0275069 0 0 0 0 0.04194 0 0 0 0 0.388333 0 0 0 0.15 0"/>
                                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_590_5466"/>
                                </filter>
                                <filter id="filter2_i_590_5466" x="30.8398" y="25.0452" width="25.582" height="27.7966" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                <feOffset dx="2" dy="2"/>
                                <feGaussianBlur stdDeviation="1.5"/>
                                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.34 0"/>
                                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_590_5466"/>
                                </filter>
                                </defs>
                                </svg> ` +
                        `</div>` +
                        `</div>`
                    );
                    infowindow.open({
                        anchor: marker,
                        map,
                        shouldFocus: true
                    });
                    let bounds = new google.maps.LatLngBounds();
                    bounds.extend(new google.maps.LatLng(this.tripEventData[i].gpsLatitude, this.tripEventData[i].gpsLongitude));
                    map.fitBounds(bounds, { top: 30, right: 10, left: 50 });
                });

                if (this.tripEventData[i].id === indexeventId) {
                    let bounds = new google.maps.LatLngBounds();
                    bounds.extend(new google.maps.LatLng(this.tripEventData[i].gpsLatitude, this.tripEventData[i].gpsLongitude));
                    map.fitBounds(bounds);
                }
            }
        }
        snappedPolyline.setMap(map);
        this.animateLine(snappedPolyline, tripLane);
        this.trackloading = false;
    }

    tripMap(indexeventId?: number) {
        const key = 'AIzaSyBYarY6_L9Oy_hO1bjSkbeW1Ss5VTj_PR4';
        this.trackloading = true;
        let snappedCoordinates: any = [];
        let tripLane: any = [];
        let lineSymbol = {
            path: google.maps.SymbolPath.CIRCLE,
            fillOpacity: 1,
            strokeColor: '#003D7A',
            fillColor: '#FFF',
            scale: 6
        };

        let arrayApi = [];
        var bounds = new google.maps.LatLngBounds();
        for (let index = 0; index < this.result.length; index++) {
            const url = fetch(`https://roads.googleapis.com/v1/snapToRoads?interpolate=true&key=${key}&path=${this.result[index].join('|')}`, {
                method: 'GET'
            });
            arrayApi.push(url);
        }

        Promise.all(arrayApi).then(function (responses) {
            return Promise.all(responses.map(function (response) {
                return response.json();
            }));
        }).then((data) => {
            data.map((item) => {
                for (let i = 0; i < item.snappedPoints.length; i++) {
                    let latlang = new google.maps.LatLng(
                        item.snappedPoints[i].location.latitude,
                        item.snappedPoints[i].location.longitude
                    );
                    snappedCoordinates.push(latlang);
                    tripLane.push({ lat: item.snappedPoints[i].location.latitude, long: item.snappedPoints[i].location.longitude, originalIndex: item.snappedPoints[i].originalIndex });
                }
            });
            let snappedPolyline = new google.maps.Polyline({
                path: snappedCoordinates,
                geodesic: true,
                strokeColor: '#003D7A',
                strokeOpacity: 1,
                icons: [
                    {
                        icon: lineSymbol,
                        offset: '100%'
                    }
                ]
            });

            this.tripLine(snappedPolyline, tripLane, indexeventId);
        }).catch(function () {
        });
    }

    handlePlayVideo(eventId: any, activeindex?: number, gpsLongitude?: any, gpsLatitude?: any) {
        console.log('eventId', eventId)
        this.videoDio = true;
        this.loading = true;
        this.eventId = eventId;
        this.videoGpsLongitude = gpsLongitude;
        this.videoGpsLatitude = gpsLatitude;
        this.isActive = activeindex;
    }

    hideDetail() {
        this.videoDio = false;
    }

    closeloading() {
        this.loading = false;
    }

    initMaps() {
        let map: any;
        let lat = this.mapCenterLat;
        let lng = this.mapCenterLng;
        let latlng = { lat, lng };
        let myOptions = {
            zoom: this.centerZoom,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: [
                {
                    featureType: 'administrative',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#444444'
                        }
                    ]
                },
                {
                    featureType: 'administrative.country',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            saturation: '100'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                },
                {
                    featureType: 'administrative.country',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            saturation: '-100'
                        },
                        {
                            visibility: 'off'
                        },
                        {
                            lightness: '-100'
                        },
                        {
                            color: '#ff0000'
                        }
                    ]
                },
                {
                    featureType: 'administrative.country',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#fefefe'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                },
                {
                    featureType: 'administrative.locality',
                    elementType: 'labels.text',
                    stylers: [
                        {
                            saturation: '100'
                        },
                        {
                            lightness: '100'
                        },
                        {
                            weight: '0.01'
                        }
                    ]
                },
                {
                    featureType: 'administrative.locality',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            lightness: '-87'
                        },
                        {
                            saturation: '-100'
                        },
                        {
                            hue: '#ff0079'
                        }
                    ]
                },
                {
                    featureType: 'administrative.locality',
                    elementType: 'labels.text.stroke',
                    stylers: [
                        {
                            saturation: '-100'
                        },
                        {
                            lightness: '-100'
                        },
                        {
                            gamma: '3.06'
                        }
                    ]
                },
                {
                    featureType: 'landscape',
                    elementType: 'all',
                    stylers: [
                        {
                            color: '#f2f2f2'
                        }
                    ]
                },
                {
                    featureType: 'poi',
                    elementType: 'all',
                    stylers: [
                        {
                            visibility: 'off'
                        }
                    ]
                },
                {
                    featureType: 'poi.attraction',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            color: '#dddddd'
                        }
                    ]
                },
                {
                    featureType: 'poi.attraction',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#c90a0a'
                        }
                    ]
                },
                {
                    featureType: 'poi.government',
                    elementType: 'geometry',
                    stylers: [
                        {
                            color: '#c23232'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                },
                {
                    featureType: 'poi.park',
                    elementType: 'geometry',
                    stylers: [
                        {
                            color: '#b60202'
                        }
                    ]
                },
                {
                    featureType: 'poi.place_of_worship',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#b20a0a'
                        }
                    ]
                },
                {
                    featureType: 'poi.place_of_worship',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            visibility: 'on'
                        },
                        {
                            color: '#b20000'
                        }
                    ]
                },
                {
                    featureType: 'poi.sports_complex',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#160101'
                        }
                    ]
                },
                {
                    featureType: 'road',
                    elementType: 'all',
                    stylers: [
                        {
                            saturation: -100
                        },
                        {
                            lightness: 45
                        }
                    ]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'all',
                    stylers: [
                        {
                            visibility: 'simplified'
                        }
                    ]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            color: '#acaaaa'
                        }
                    ]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'labels.text.stroke',
                    stylers: [
                        {
                            visibility: 'on'
                        },
                        {
                            color: '#625d5d'
                        }
                    ]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            weight: '0.01'
                        }
                    ]
                },
                {
                    featureType: 'road.highway.controlled_access',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            color: '#f6d467'
                        }
                    ]
                },
                {
                    featureType: 'road.highway.controlled_access',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#000000'
                        }
                    ]
                },
                {
                    featureType: 'road.highway.controlled_access',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            lightness: '-2'
                        },
                        {
                            saturation: '-11'
                        },
                        {
                            gamma: '1.95'
                        }
                    ]
                },
                {
                    featureType: 'road.arterial',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            visibility: 'off'
                        }
                    ]
                },
                {
                    featureType: 'transit',
                    elementType: 'all',
                    stylers: [
                        {
                            visibility: 'off'
                        }
                    ]
                },
                {
                    featureType: 'transit.station.bus',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#d35252'
                        }
                    ]
                },
                {
                    featureType: 'transit.station.bus',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#81efdd'
                        }
                    ]
                },
                {
                    featureType: 'water',
                    elementType: 'all',
                    stylers: [
                        {
                            color: '#e7e7e7'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                },
                {
                    featureType: 'water',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            color: '#c6e6f0'
                        }
                    ]
                },
                {
                    featureType: 'water',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#bcadad'
                        }
                    ]
                },
                {
                    featureType: 'water',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#e9ecf3'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                }
            ]
        };
        map = new google.maps.Map(document.getElementById('map'), myOptions);
        var bounds = new google.maps.LatLngBounds();
        let gpsDataArray: any = [];
        this.dataList.forEach((item: any, i: any) => {
            if (item.gpsData) {
                gpsDataArray.push(item.gpsData);
                const infowindow = new google.maps.InfoWindow({
                    content: `<div class="infoImage" id='content'> <div style="display:flex"><div style="color: #585F67;font-size:16px;font-weight: 600">${item.driverName}  </div><div style="margin: 0 4px">-</div><div style="font-size:16px;color: #3D72AE">${item.plateNo}</div></div> ` + `<div id='siteNotice'>` + `<img style='width:400px;height:300px;border-radius: 6px;margin-top: 4px' id="${item.plateNo}" src=${item.lastPicture ? `${this.hostName}/upload/` + item.lastPicture : this.noData} onerror="${this.checkImagegetImage(item.lastPicture)}"   alt=''>` + '</div>' + '</div>'
                });
                let symbol: string = '';
                if (item.mode === 'parking') {
                    symbol = this.greencar;
                } else {
                    symbol = this.bulecar;
                }
                this.cariconSymbol = symbol;
                let positions;
                if (item.gpsData.coordinate) {
                    positions = { lat: Number(item.gpsData.coordinate[1]), lng: Number(item.gpsData.coordinate[0]) };
                    bounds.extend(new google.maps.LatLng(Number(item.gpsData.coordinate[1]), Number(item.gpsData.coordinate[0])));
                } else {
                    positions = { lat: this.mapCenterLat, lng: this.mapCenterLng };
                }
                const beachMarker = new google.maps.Marker({
                    position: positions,
                    map,
                    icon: this.cariconSymbol
                });
                beachMarker.addListener('click', () => {
                    // this.handleDetailClickCar(item.cameraSn, item.plateNo, item.driverName, item);
                    this.handleDetailClick(item.cameraSn, item.plateNo, item.driverName, item);
                });
                beachMarker.addListener('mouseover', () => {
                    infowindow.open({
                        anchor: beachMarker,
                        map,
                        shouldFocus: false
                    });
                });
                beachMarker.addListener('mouseout', () => {
                    infowindow.close();
                });
            }
        });
        if (this.dataList.length > 1 && gpsDataArray.length > 1) {
            map.fitBounds(bounds);
        }
    }

    eventListMap(activeitems?: any, activeindexs?: number) {
        this.isActive = activeindexs || '';
        let map: any;
        let lat = this.mapCenterLat;
        let lng = this.mapCenterLng;
        let latlng = { lat, lng };
        let myOptions = {
            zoom: this.centerZoom,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: [
                {
                    featureType: 'administrative',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#444444'
                        }
                    ]
                },
                {
                    featureType: 'administrative.country',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            saturation: '100'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                },
                {
                    featureType: 'administrative.country',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            saturation: '-100'
                        },
                        {
                            visibility: 'off'
                        },
                        {
                            lightness: '-100'
                        },
                        {
                            color: '#ff0000'
                        }
                    ]
                },
                {
                    featureType: 'administrative.country',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#fefefe'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                },
                {
                    featureType: 'administrative.locality',
                    elementType: 'labels.text',
                    stylers: [
                        {
                            saturation: '100'
                        },
                        {
                            lightness: '100'
                        },
                        {
                            weight: '0.01'
                        }
                    ]
                },
                {
                    featureType: 'administrative.locality',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            lightness: '-87'
                        },
                        {
                            saturation: '-100'
                        },
                        {
                            hue: '#ff0079'
                        }
                    ]
                },
                {
                    featureType: 'administrative.locality',
                    elementType: 'labels.text.stroke',
                    stylers: [
                        {
                            saturation: '-100'
                        },
                        {
                            lightness: '-100'
                        },
                        {
                            gamma: '3.06'
                        }
                    ]
                },
                {
                    featureType: 'landscape',
                    elementType: 'all',
                    stylers: [
                        {
                            color: '#f2f2f2'
                        }
                    ]
                },
                {
                    featureType: 'poi',
                    elementType: 'all',
                    stylers: [
                        {
                            visibility: 'off'
                        }
                    ]
                },
                {
                    featureType: 'poi.attraction',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            color: '#dddddd'
                        }
                    ]
                },
                {
                    featureType: 'poi.attraction',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#c90a0a'
                        }
                    ]
                },
                {
                    featureType: 'poi.government',
                    elementType: 'geometry',
                    stylers: [
                        {
                            color: '#c23232'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                },
                {
                    featureType: 'poi.park',
                    elementType: 'geometry',
                    stylers: [
                        {
                            color: '#b60202'
                        }
                    ]
                },
                {
                    featureType: 'poi.place_of_worship',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#b20a0a'
                        }
                    ]
                },
                {
                    featureType: 'poi.place_of_worship',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            visibility: 'on'
                        },
                        {
                            color: '#b20000'
                        }
                    ]
                },
                {
                    featureType: 'poi.sports_complex',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#160101'
                        }
                    ]
                },
                {
                    featureType: 'road',
                    elementType: 'all',
                    stylers: [
                        {
                            saturation: -100
                        },
                        {
                            lightness: 45
                        }
                    ]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'all',
                    stylers: [
                        {
                            visibility: 'simplified'
                        }
                    ]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            color: '#acaaaa'
                        }
                    ]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'labels.text.stroke',
                    stylers: [
                        {
                            visibility: 'on'
                        },
                        {
                            color: '#625d5d'
                        }
                    ]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            weight: '0.01'
                        }
                    ]
                },
                {
                    featureType: 'road.highway.controlled_access',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            color: '#f6d467'
                        }
                    ]
                },
                {
                    featureType: 'road.highway.controlled_access',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#000000'
                        }
                    ]
                },
                {
                    featureType: 'road.highway.controlled_access',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            lightness: '-2'
                        },
                        {
                            saturation: '-11'
                        },
                        {
                            gamma: '1.95'
                        }
                    ]
                },
                {
                    featureType: 'road.arterial',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            visibility: 'off'
                        }
                    ]
                },
                {
                    featureType: 'transit',
                    elementType: 'all',
                    stylers: [
                        {
                            visibility: 'off'
                        }
                    ]
                },
                {
                    featureType: 'transit.station.bus',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#d35252'
                        }
                    ]
                },
                {
                    featureType: 'transit.station.bus',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#81efdd'
                        }
                    ]
                },
                {
                    featureType: 'water',
                    elementType: 'all',
                    stylers: [
                        {
                            color: '#e7e7e7'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                },
                {
                    featureType: 'water',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            color: '#c6e6f0'
                        }
                    ]
                },
                {
                    featureType: 'water',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#bcadad'
                        }
                    ]
                },
                {
                    featureType: 'water',
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            color: '#e9ecf3'
                        },
                        {
                            visibility: 'on'
                        }
                    ]
                }
            ]
        };
        map = new google.maps.Map(document.getElementById('map'), myOptions);
        var bounds = new google.maps.LatLngBounds();
        let positions: any;
        let infowindow = new google.maps.InfoWindow({
            content: ''
        });
        this.timeEventList.forEach((item: any, index: any) => {
            if (item.length) {
                item.forEach((items: any, i: any) => {
                    if (items.gpsLatitude && items.gpsLongitude) {
                        positions = { lat: items.gpsLatitude, lng: items.gpsLongitude };
                        bounds.extend(new google.maps.LatLng(items.gpsLatitude, items.gpsLongitude));
                    }
                    const beachMarker = new google.maps.Marker({
                        position: positions,
                        map,
                        icon: item[i].eventType === 'FORWARD_COLLISION_WARNING' ? this.Icon.FORWARD_COLLISION_WARNING :
                            item[i].eventType === 'SEVERE_TURN' ? this.Icon.SEVERE_TURN :
                                item[i].eventType === 'HARSH_TURN' ? this.Icon.SEVERE_TURN :
                                    item[i].eventType === 'SHARP_TURN' ? this.Icon.SEVERE_TURN :
                                        item[i].eventType === 'SEVERE_BRAKE' ? this.Icon.HARSH_BRAKE :
                                            item[i].eventType === 'HARSH_BRAKE' ? this.Icon.HARSH_BRAKE :
                                                item[i].eventType === 'HARD_BRAKE' ? this.Icon.HARSH_BRAKE :
                                                    item[i].eventType === 'SEVERE_ACCEL' ? this.Icon.HARSH_ACCEL :
                                                        item[i].eventType === 'HARSH_ACCEL' ? this.Icon.HARSH_ACCEL :
                                                            item[i].eventType === 'HARD_ACCEL' ? this.Icon.HARSH_ACCEL :
                                                                item[i].eventType === 'DRIVING_LIGHT_HIT' ? this.Icon.DRIVING_HEAVY_HIT :
                                                                    item[i].eventType === 'DRIVING_SUSPICIOUS_HIT' ? this.Icon.DRIVING_HEAVY_HIT :
                                                                        item[i].eventType === 'DRIVING_HEAVY_HIT' ? this.Icon.DRIVING_HEAVY_HIT :
                                                                            item[i].eventType === 'PARKING_HIT' ? this.Icon.PARKING_HIT :
                                                                                item[i].eventType === 'PARKING_HEAVY_HIT' ? this.Icon.PARKING_HIT :
                                                                                    item[i].eventType === 'NO_DRIVER' ? this.Icon.NO_DRIVER :
                                                                                        item[i].eventType === 'ASLEEP' ? this.Icon.ASLEEP :
                                                                                            item[i].eventType === 'DROWSINESS' ? this.Icon.DROWSINESS :
                                                                                                item[i].eventType === 'YAWN' ? this.Icon.YAWN :
                                                                                                    item[i].eventType === 'DAYDREAMING' ? this.Icon.DAYDREAMING :
                                                                                                        item[i].eventType === 'USING_PHONE' ? this.Icon.USING_PHONE :
                                                                                                            item[i].eventType === 'DISTRACTED' ? this.Icon.DISTRACTED :
                                                                                                                item[i].eventType === 'SMOKING' ? this.Icon.SMOKING :
                                                                                                                    item[i].eventType === 'NO_SEATBELT' ? this.Icon.NO_SEATBELT : this.eventicon
                    });
                    beachMarker.addListener('mouseover', () => {
                        infowindow.setContent(
                            `<div id='infowindows${index}-${i}'>` +
                            `<div class='leftBar'>` +
                            `</div style='display: flex'>` +
                            `</div>` +
                            `<div  style='display: flex'>` +
                            `<div class='content'>` +
                            `<div class='type' style='margin-bottom: 5px;color:#1B1D1F;font-size: 16px;font-weight: 600'>${this.handleCVEvent(item[i].eventType)}</div>` +
                            `<div style='color: #898F96;font-size:16px;font-weight: 600;display: flex' class='time'>${Utils.formatDateStringVN(item[i].gpsTime ? item[i].gpsTime : item[i].createTime).split(" ")[0]}<div style='color: #898F96;font-size:12px;font-weight: 400;margin-left: 6px;margin-top: 3px'>${Utils.formatDateStringVN(item[i].gpsTime ? item[i].gpsTime : item[i].createTime).split(" ")[1]}</div></div>` +
                            `<div style='display:flex;align-items: center'>` +
                            `<div class='duration' style='align-items: center;color: #8301A3;margin-top: 4px'>${this.t('VIDEO_LENGTH')} ${item[i].duration / 1000} ${this.t('second')}</div>` +
                            `<div > ` +
                            `</div>` +
                            '</div>' +
                            '</div>' +
                            `<svg onclick=handlePlayVideo(${item[i].id},${item[i].id},${item[i].gpsLongitude},${item[i].gpsLatitude}) style='cursor: pointer;margin-left: 10px;margin-right: 5px;' width="60" height="60" viewBox="0 0 86 86" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g filter="url(#filter0_d_590_5466)">
                                <g filter="url(#filter1_i_590_5466)">
                                <path d="M71.327 37.9435C71.327 42.1444 70.4995 46.3043 68.8919 50.1854C67.2843 54.0666 64.9279 57.5932 61.9574 60.5637C58.9868 63.5342 55.4603 65.8906 51.5791 67.4982C47.6979 69.1059 43.5381 69.9333 39.3371 69.9333C35.1362 69.9333 30.9763 69.1059 27.0951 67.4982C23.214 65.8906 19.6874 63.5342 16.7169 60.5637C13.7464 57.5932 11.39 54.0666 9.78237 50.1854C8.17473 46.3043 7.34729 42.1444 7.34729 37.9435C7.34729 29.4592 10.7176 21.3225 16.7169 15.3232C22.7162 9.32396 30.8529 5.95361 39.3371 5.95361C47.8214 5.95361 55.9581 9.32396 61.9574 15.3232C67.9566 21.3225 71.327 29.4592 71.327 37.9435Z" fill="#D8F1FF"/>
                                </g>
                                <path d="M71.327 37.9435C71.327 42.1444 70.4995 46.3043 68.8919 50.1854C67.2843 54.0666 64.9279 57.5932 61.9574 60.5637C58.9868 63.5342 55.4603 65.8906 51.5791 67.4982C47.6979 69.1059 43.5381 69.9333 39.3371 69.9333C35.1362 69.9333 30.9763 69.1059 27.0951 67.4982C23.214 65.8906 19.6874 63.5342 16.7169 60.5637C13.7464 57.5932 11.39 54.0666 9.78237 50.1854C8.17473 46.3043 7.34729 42.1444 7.34729 37.9435C7.34729 29.4592 10.7176 21.3225 16.7169 15.3232C22.7162 9.32396 30.8529 5.95361 39.3371 5.95361C47.8214 5.95361 55.9581 9.32396 61.9574 15.3232C67.9566 21.3225 71.327 29.4592 71.327 37.9435Z" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
                                <g filter="url(#filter2_i_590_5466)">
                                <path d="M53.2351 36.7776C53.4432 36.8929 53.6167 37.0618 53.7375 37.2669C53.8582 37.4719 53.9219 37.7055 53.9219 37.9434C53.9219 38.1814 53.8582 38.415 53.7375 38.62C53.6167 38.825 53.4432 38.9939 53.2351 39.1093L33.3197 50.1742C33.1167 50.2869 32.8879 50.3446 32.6558 50.3416C32.4237 50.3387 32.1964 50.2751 31.9964 50.1574C31.7964 50.0396 31.6306 49.8716 31.5155 49.6701C31.4003 49.4686 31.3398 49.2405 31.3398 49.0084V26.8785C31.3398 25.8619 32.4311 25.2221 33.3197 25.7162L53.2351 36.7776Z" fill="#146EC1"/>
                                </g>
                                <path d="M53.2351 36.7776C53.4432 36.8929 53.6167 37.0618 53.7375 37.2669C53.8582 37.4719 53.9219 37.7055 53.9219 37.9434C53.9219 38.1814 53.8582 38.415 53.7375 38.62C53.6167 38.825 53.4432 38.9939 53.2351 39.1093L33.3197 50.1742C33.1167 50.2869 32.8879 50.3446 32.6558 50.3416C32.4237 50.3387 32.1964 50.2751 31.9964 50.1574C31.7964 50.0396 31.6306 49.8716 31.5155 49.6701C31.4003 49.4686 31.3398 49.2405 31.3398 49.0084V26.8785C31.3398 25.8619 32.4311 25.2221 33.3197 25.7162L53.2351 36.7776Z" stroke="#D8F1FF" stroke-linecap="round" stroke-linejoin="round"/>
                                </g>
                                <defs>
                                <filter id="filter0_d_590_5466" x="0.84729" y="0.453613" width="84.9797" height="84.9797" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                <feOffset dx="4" dy="5"/>
                                <feGaussianBlur stdDeviation="5"/>
                                <feComposite in2="hardAlpha" operator="out"/>
                                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"/>
                                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_590_5466"/>
                                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_590_5466" result="shape"/>
                                </filter>
                                <filter id="filter1_i_590_5466" x="6.84729" y="5.45361" width="67.9797" height="67.9797" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                <feOffset dx="3" dy="3"/>
                                <feGaussianBlur stdDeviation="2"/>
                                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                                <feColorMatrix type="matrix" values="0 0 0 0 0.0275069 0 0 0 0 0.04194 0 0 0 0 0.388333 0 0 0 0.15 0"/>
                                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_590_5466"/>
                                </filter>
                                <filter id="filter2_i_590_5466" x="30.8398" y="25.0452" width="25.582" height="27.7966" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                <feOffset dx="2" dy="2"/>
                                <feGaussianBlur stdDeviation="1.5"/>
                                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.34 0"/>
                                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_590_5466"/>
                                </filter>
                                </defs>
                                </svg> ` +
                            `</div>` +
                            `</div>`
                        );
                        infowindow.open({
                            anchor: beachMarker,
                            map,
                            shouldFocus: true
                        });
                    });

                    beachMarker.addListener('click', () => {
                        infowindow.setContent(
                            `<div id='infowindows${index}-${i}'>` +
                            `<div class='leftBar'>` +
                            `</div style='display: flex'>` +
                            `</div>` +
                            `<div  style='display: flex'>` +
                            `<div class='content'>` +
                            `<div class='type' style='margin-bottom: 5px;color:#1B1D1F;font-size: 16px;font-weight: 600'>${this.handleCVEvent(item[i].eventType)}</div>` +
                            `<div style='color: #898F96;font-size:16px;font-weight: 600;display: flex' class='time'>${Utils.formatDateStringVN(item[i].gpsTime ? item[i].gpsTime : item[i].createTime).split(" ")[0]}<div style='color: #898F96;font-size:12px;font-weight: 400;margin-left: 6px;margin-top: 3px'>${Utils.formatDateStringVN(item[i].gpsTime ? item[i].gpsTime : item[i].createTime).split(" ")[1]}</div></div>` +
                            `<div style='display:flex;align-items: center'>` +
                            `<div class='duration' style='align-items: center;color: #8301A3;margin-top: 4px'>${this.t('VIDEO_LENGTH')} ${item[i].duration / 1000} ${this.t('second')}</div>` +
                            `<div > ` +
                            `</div>` +
                            '</div>' +
                            '</div>' +
                            `<svg onclick=handlePlayVideo(${item[i].id},${item[i].id},${item[i].gpsLongitude},${item[i].gpsLatitude}) style='cursor: pointer;margin-left: 10px;margin-right: 5px;' width="60" height="60" viewBox="0 0 86 86" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g filter="url(#filter0_d_590_5466)">
                                <g filter="url(#filter1_i_590_5466)">
                                <path d="M71.327 37.9435C71.327 42.1444 70.4995 46.3043 68.8919 50.1854C67.2843 54.0666 64.9279 57.5932 61.9574 60.5637C58.9868 63.5342 55.4603 65.8906 51.5791 67.4982C47.6979 69.1059 43.5381 69.9333 39.3371 69.9333C35.1362 69.9333 30.9763 69.1059 27.0951 67.4982C23.214 65.8906 19.6874 63.5342 16.7169 60.5637C13.7464 57.5932 11.39 54.0666 9.78237 50.1854C8.17473 46.3043 7.34729 42.1444 7.34729 37.9435C7.34729 29.4592 10.7176 21.3225 16.7169 15.3232C22.7162 9.32396 30.8529 5.95361 39.3371 5.95361C47.8214 5.95361 55.9581 9.32396 61.9574 15.3232C67.9566 21.3225 71.327 29.4592 71.327 37.9435Z" fill="#D8F1FF"/>
                                </g>
                                <path d="M71.327 37.9435C71.327 42.1444 70.4995 46.3043 68.8919 50.1854C67.2843 54.0666 64.9279 57.5932 61.9574 60.5637C58.9868 63.5342 55.4603 65.8906 51.5791 67.4982C47.6979 69.1059 43.5381 69.9333 39.3371 69.9333C35.1362 69.9333 30.9763 69.1059 27.0951 67.4982C23.214 65.8906 19.6874 63.5342 16.7169 60.5637C13.7464 57.5932 11.39 54.0666 9.78237 50.1854C8.17473 46.3043 7.34729 42.1444 7.34729 37.9435C7.34729 29.4592 10.7176 21.3225 16.7169 15.3232C22.7162 9.32396 30.8529 5.95361 39.3371 5.95361C47.8214 5.95361 55.9581 9.32396 61.9574 15.3232C67.9566 21.3225 71.327 29.4592 71.327 37.9435Z" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
                                <g filter="url(#filter2_i_590_5466)">
                                <path d="M53.2351 36.7776C53.4432 36.8929 53.6167 37.0618 53.7375 37.2669C53.8582 37.4719 53.9219 37.7055 53.9219 37.9434C53.9219 38.1814 53.8582 38.415 53.7375 38.62C53.6167 38.825 53.4432 38.9939 53.2351 39.1093L33.3197 50.1742C33.1167 50.2869 32.8879 50.3446 32.6558 50.3416C32.4237 50.3387 32.1964 50.2751 31.9964 50.1574C31.7964 50.0396 31.6306 49.8716 31.5155 49.6701C31.4003 49.4686 31.3398 49.2405 31.3398 49.0084V26.8785C31.3398 25.8619 32.4311 25.2221 33.3197 25.7162L53.2351 36.7776Z" fill="#146EC1"/>
                                </g>
                                <path d="M53.2351 36.7776C53.4432 36.8929 53.6167 37.0618 53.7375 37.2669C53.8582 37.4719 53.9219 37.7055 53.9219 37.9434C53.9219 38.1814 53.8582 38.415 53.7375 38.62C53.6167 38.825 53.4432 38.9939 53.2351 39.1093L33.3197 50.1742C33.1167 50.2869 32.8879 50.3446 32.6558 50.3416C32.4237 50.3387 32.1964 50.2751 31.9964 50.1574C31.7964 50.0396 31.6306 49.8716 31.5155 49.6701C31.4003 49.4686 31.3398 49.2405 31.3398 49.0084V26.8785C31.3398 25.8619 32.4311 25.2221 33.3197 25.7162L53.2351 36.7776Z" stroke="#D8F1FF" stroke-linecap="round" stroke-linejoin="round"/>
                                </g>
                                <defs>
                                <filter id="filter0_d_590_5466" x="0.84729" y="0.453613" width="84.9797" height="84.9797" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                <feOffset dx="4" dy="5"/>
                                <feGaussianBlur stdDeviation="5"/>
                                <feComposite in2="hardAlpha" operator="out"/>
                                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"/>
                                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_590_5466"/>
                                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_590_5466" result="shape"/>
                                </filter>
                                <filter id="filter1_i_590_5466" x="6.84729" y="5.45361" width="67.9797" height="67.9797" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                <feOffset dx="3" dy="3"/>
                                <feGaussianBlur stdDeviation="2"/>
                                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                                <feColorMatrix type="matrix" values="0 0 0 0 0.0275069 0 0 0 0 0.04194 0 0 0 0 0.388333 0 0 0 0.15 0"/>
                                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_590_5466"/>
                                </filter>
                                <filter id="filter2_i_590_5466" x="30.8398" y="25.0452" width="25.582" height="27.7966" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                <feOffset dx="2" dy="2"/>
                                <feGaussianBlur stdDeviation="1.5"/>
                                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.34 0"/>
                                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_590_5466"/>
                                </filter>
                                </defs>
                                </svg> ` +
                            `</div>` +
                            `</div>`
                        );
                        infowindow.open({
                            anchor: beachMarker,
                            map,
                            shouldFocus: true
                        });
                        let bounds = new google.maps.LatLngBounds();
                        bounds.extend(new google.maps.LatLng(item[i].gpsLatitude, item[i].gpsLongitude));
                        map.fitBounds(bounds);
                    });
                    if (activeitems) {
                        if (items.id === activeitems.id) {
                            infowindow.setContent(
                                `<div class='infowindows'>` +
                                `<div class='leftBar'>` +
                                `</div>` +
                                `<div class='content'>` +
                                `<div class='type'>${this.handleCVEvent(activeitems.eventType)}</div>` +
                                `<div class='time'>${this.defaultTimeValue(activeitems.gpsTime)}</div>` +
                                `<div class='duration'>Thời lượng：${activeitems.duration / 1000}s</div>` +
                                '</div>' +
                                `<div onclick=handlePlayVideo(${activeitems.id},${activeitems.id},${activeitems.gpsLongitude},${activeitems.gpsLatitude})> ` +
                                `<img  src='https://data.waylens.com/a50ea735abd819a6d229b55431be7da0.svg' alt=''>` +
                                `</div>` +
                                `</div>`
                            );
                            infowindow.setContent(
                                `<div id='infowindows'>` +
                                `<div class='leftBar'>` +
                                `</div style='display: flex'>` +
                                `</div>` +
                                `<div  style='display: flex'>` +
                                `<div class='content'>` +
                                `<div class='type' style='margin-bottom: 5px;color:#1B1D1F;font-size: 16px;font-weight: 600'>${this.handleCVEvent(activeitems.eventType)}</div>` +
                                `<div style='color: #898F96;font-size:16px;font-weight: 600;display: flex' class='time'>${Utils.formatDateStringVN(activeitems.gpsTime ? activeitems.gpsTime : activeitems.createTime).split(" ")[0]}<div style='color: #898F96;font-size:12px;font-weight: 400;margin-left: 6px;margin-top: 3px'>${Utils.formatDateStringVN(activeitems.gpsTime ? activeitems.gpsTime : activeitems.createTime).split(" ")[1]}</div></div>` +
                                `<div style='display:flex;align-items: center'>` +
                                `<div class='duration' style='align-items: center;color: #8301A3;margin-top: 4px'>${this.t('VIDEO_LENGTH')} ${activeitems.duration / 1000} ${this.t('second')}</div>` +
                                `<div > ` +
                                `</div>` +
                                '</div>' +
                                '</div>' +
                                `<svg onclick=handlePlayVideo(${activeitems.id},${activeitems.id},${activeitems.gpsLongitude},${activeitems.gpsLatitude}) style='cursor: pointer;margin-left: 10px;margin-right: 5px;' width="60" height="60" viewBox="0 0 86 86" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g filter="url(#filter0_d_590_5466)">
                                <g filter="url(#filter1_i_590_5466)">
                                <path d="M71.327 37.9435C71.327 42.1444 70.4995 46.3043 68.8919 50.1854C67.2843 54.0666 64.9279 57.5932 61.9574 60.5637C58.9868 63.5342 55.4603 65.8906 51.5791 67.4982C47.6979 69.1059 43.5381 69.9333 39.3371 69.9333C35.1362 69.9333 30.9763 69.1059 27.0951 67.4982C23.214 65.8906 19.6874 63.5342 16.7169 60.5637C13.7464 57.5932 11.39 54.0666 9.78237 50.1854C8.17473 46.3043 7.34729 42.1444 7.34729 37.9435C7.34729 29.4592 10.7176 21.3225 16.7169 15.3232C22.7162 9.32396 30.8529 5.95361 39.3371 5.95361C47.8214 5.95361 55.9581 9.32396 61.9574 15.3232C67.9566 21.3225 71.327 29.4592 71.327 37.9435Z" fill="#D8F1FF"/>
                                </g>
                                <path d="M71.327 37.9435C71.327 42.1444 70.4995 46.3043 68.8919 50.1854C67.2843 54.0666 64.9279 57.5932 61.9574 60.5637C58.9868 63.5342 55.4603 65.8906 51.5791 67.4982C47.6979 69.1059 43.5381 69.9333 39.3371 69.9333C35.1362 69.9333 30.9763 69.1059 27.0951 67.4982C23.214 65.8906 19.6874 63.5342 16.7169 60.5637C13.7464 57.5932 11.39 54.0666 9.78237 50.1854C8.17473 46.3043 7.34729 42.1444 7.34729 37.9435C7.34729 29.4592 10.7176 21.3225 16.7169 15.3232C22.7162 9.32396 30.8529 5.95361 39.3371 5.95361C47.8214 5.95361 55.9581 9.32396 61.9574 15.3232C67.9566 21.3225 71.327 29.4592 71.327 37.9435Z" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
                                <g filter="url(#filter2_i_590_5466)">
                                <path d="M53.2351 36.7776C53.4432 36.8929 53.6167 37.0618 53.7375 37.2669C53.8582 37.4719 53.9219 37.7055 53.9219 37.9434C53.9219 38.1814 53.8582 38.415 53.7375 38.62C53.6167 38.825 53.4432 38.9939 53.2351 39.1093L33.3197 50.1742C33.1167 50.2869 32.8879 50.3446 32.6558 50.3416C32.4237 50.3387 32.1964 50.2751 31.9964 50.1574C31.7964 50.0396 31.6306 49.8716 31.5155 49.6701C31.4003 49.4686 31.3398 49.2405 31.3398 49.0084V26.8785C31.3398 25.8619 32.4311 25.2221 33.3197 25.7162L53.2351 36.7776Z" fill="#146EC1"/>
                                </g>
                                <path d="M53.2351 36.7776C53.4432 36.8929 53.6167 37.0618 53.7375 37.2669C53.8582 37.4719 53.9219 37.7055 53.9219 37.9434C53.9219 38.1814 53.8582 38.415 53.7375 38.62C53.6167 38.825 53.4432 38.9939 53.2351 39.1093L33.3197 50.1742C33.1167 50.2869 32.8879 50.3446 32.6558 50.3416C32.4237 50.3387 32.1964 50.2751 31.9964 50.1574C31.7964 50.0396 31.6306 49.8716 31.5155 49.6701C31.4003 49.4686 31.3398 49.2405 31.3398 49.0084V26.8785C31.3398 25.8619 32.4311 25.2221 33.3197 25.7162L53.2351 36.7776Z" stroke="#D8F1FF" stroke-linecap="round" stroke-linejoin="round"/>
                                </g>
                                <defs>
                                <filter id="filter0_d_590_5466" x="0.84729" y="0.453613" width="84.9797" height="84.9797" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                <feOffset dx="4" dy="5"/>
                                <feGaussianBlur stdDeviation="5"/>
                                <feComposite in2="hardAlpha" operator="out"/>
                                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"/>
                                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_590_5466"/>
                                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_590_5466" result="shape"/>
                                </filter>
                                <filter id="filter1_i_590_5466" x="6.84729" y="5.45361" width="67.9797" height="67.9797" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                <feOffset dx="3" dy="3"/>
                                <feGaussianBlur stdDeviation="2"/>
                                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                                <feColorMatrix type="matrix" values="0 0 0 0 0.0275069 0 0 0 0 0.04194 0 0 0 0 0.388333 0 0 0 0.15 0"/>
                                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_590_5466"/>
                                </filter>
                                <filter id="filter2_i_590_5466" x="30.8398" y="25.0452" width="25.582" height="27.7966" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                <feOffset dx="2" dy="2"/>
                                <feGaussianBlur stdDeviation="1.5"/>
                                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.34 0"/>
                                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_590_5466"/>
                                </filter>
                                </defs>
                                </svg> ` +
                                `</div>` +
                                `</div>`
                            );
                            infowindow.open({
                                anchor: beachMarker,
                                map,
                                shouldFocus: false
                            });
                            let bounds = new google.maps.LatLngBounds();
                            bounds.extend(new google.maps.LatLng(activeitems.gpsLatitude, activeitems.gpsLongitude));
                            map.fitBounds(bounds);
                        }
                    }
                });
            }
        });
        if (this.timeEventList.length > 1) {

            map.fitBounds(bounds);
        }
        this.handlePlayVideo(activeitems.id, activeindexs, activeitems.gpsLongitude, activeitems.gpsLatitude)
    }
    handlecCllapseChange(val: any) {
        this.cllapseVal = val;
        this.isActive = '';
    }
    
    // Debug method to test scroll
    testScrollToTrip(tripIndex: number) {
        console.log('Testing scroll to trip index:', tripIndex);
        this.forceScrollToTrip(tripIndex);
    }
    async onTimeChange(t: any) {
        this.detailQueryForm.searchStartDate = t ? this.vm.$moment(t[0]).format('YYYY-MM-DD') : '';
        this.detailQueryForm.searchEndDate = t ? this.vm.$moment(t[1]).format('YYYY-MM-DD') : '';
        if (
            this.detailQueryForm.searchStartDate <
            this.vm
                .$moment(this.detailQueryForm.searchEndDate)
                .subtract(1, 'month')
                .format('YYYY-MM-DD')
        ) {
            Utils.showWarning(this.t('时间范围最大为一个月。'));
            this.detailQueryForm.searchStartDate = this.vm
                .$moment(this.detailQueryForm.searchEndDate)
                .subtract(1, 'month')
                .format('YYYY-MM-DD');
            this.timeValue = [this.detailQueryForm.searchStartDate, this.detailQueryForm.searchEndDate];
        }
        this.handleOneDetail(this.cameraSn);
    }
    async onDayChange(t: any) {
        this.tripQueryForm.searchDate = t ? this.vm.$moment(t).format('YYYY-MM-DD') : '';
        this.handleTripDetail(this.cameraSn, 1);
    }
}

</script>

<style lang='scss'>
* {
    // // font-family: 'Poppins', sans-serif;
}

.el-tabs .el-tabs--card .el-tabs--top {
    height: 30px;
    line-height: 30px;
}

.tab-bar {
    display: flex;
    width: 100%;
    height: 44px;
}

.el-collapse {
    border-top: 0px !important;
}

.green,
.blue,
.orange {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgb(91, 193, 98);
}

.green {
    background: rgb(91, 193, 98);
}

.blue {
    background: rgb(74, 145, 226);
}

.orange {
    background: orange;
}

.myMap {
    position: relative;
    padding-left: 10px;
}

.mapDetails {
    position: absolute;
    bottom: 5%;
    left: 10%;
    width: 80%;
    height: 300px;
    background-color: red;
    opacity: 0.2;
}

.num-detail-speed {
    padding: 4px 7px;
    display: flex;
    border-radius: 6px;
    margin-top: -5px;
}

.num-speedDevcie {
    color: #727880;
    background-color: #EEEEEE;
    padding: 8px 12px;
    border-radius: 10px;
    margin-left: 10px;
    font-size: 12px;
}

.event-data-item {
    box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
    border-radius: 8px;
    margin: 12px 8px;
}

.icon-bottom-item {
    display: flex !important;
}

.icon-bottom-btn {
    display: flex;
    justify-content: flex-end;
    background-color: #ebf2f5;
    border-radius: 4px;
    margin-right: 8px;
}

.icon-bottom-btn-item {
    padding-left: 10px;
    margin-top: -2px;
}

.fleet-header {
    .el-tabs__nav {
        border-radius: 20px !important;
        background: #999;
        height: 30px;
        line-height: 30px;
    }

    .el-tabs--card>.el-tabs__header {
        border: 0px;
    }

    .el-tabs--card>.el-tabs__header .el-tabs__item.is-active {
        border: 1px solid #999;
        background: #fff;
        border-radius: 20px;
    }

    .el-tabs--card>.el-tabs__header .el-tabs__item {
        background: #999;
        border-radius: 20px;
        border: 0px;
        height: 30px !important;
        line-height: 30px !important;
        font-size: 14px;
    }

}

.el-tabs__nav {
    border: none !important;

}

.el-tabs__item {
    border: none !important;
    background-color: #F5F5F5;
    line-height: 1;
    padding: 10px 16px;
    border-radius: 10px;
    height: 36px;
    margin-right: 20px;
}

.icon-bottom-detail {
    width: 12px;
    height: 12px;
}

.sim {
    padding-left: 10px;
}

.rightt {
    display: block;
}

.event-typet {
    width: 100%;
    padding-left: 20px;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -ms-flex-direction: column;
    flex-direction: column;
    padding-top: 8px;
}

.timet {
    width: 100%;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -ms-flex-direction: column;
    flex-direction: column;
    padding-left: 20px;
}

.tab-bar-container {
    display: flex;
    justify-content: space-between;
    padding-left: 4px;
    padding-right: 4px;
    padding-top: 4px;
}

.fleet-index {
    display: flex;
    background: #fff;
    padding: 10px;
    border-radius: 12px;

    .back {
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        margin-bottom: 5px;
        margin-right: 6px;
        background-color: #F5F5F5;
        padding: 10px 16px;
        border-radius: 12px;

        img {
            margin: 0 5px;
        }
    }

    .back-item {
        display: flex;
        justify-content: flex-end;
    }

    .totalcars {
        background: #fff;
        border-bottom: 0px;
        padding-left: 6px;
        padding-top: 6px;

    }

    .car-item {
        display: flex;
        justify-content: space-between;
        padding: 14px 1px 14px 13px;
        border-radius: 8px;
        margin: -2px 0 20px -6px;
        box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;

        .left {
            margin: 0 auto;

            svg {
                display: inline-block;
                width: 36px;
                height: 36px;
            }
        }

        .right {
            width: 100%;

            // margin-left: 10px;
            .top {
                .tit {
                    width: 100%;
                    text-align: left;

                    .dirivername {
                        padding-right: 5px;
                        display: flex;
                        justify-content: space-between;
                    }

                    .diriver-svg {
                        svg {
                            width: 13px;
                            height: 13px;
                        }
                    }
                }
            }

            .top :hover {
                cursor: pointer;
                color: #4a91e2 !important;
            }
        }
    }

    .detailHead {
        background: #fff !important;
    }


    .fillterBtn {
        margin-left: 10px;
        margin-right: 6px;
        border-radius: 4px;
        background-color: #E6F9EF;
        color: #36A410;
    }

    .pageList-container {
        padding: 2px 10px;
        padding-top: 12px
    }

    .pageList::-webkit-scrollbar {
        width: 8px;
        background-color: #f5f5f5;
    }

    .pageList::-webkit-scrollbar-thumb {
        background-color: #999;
        outline: 2px solid #fff;
        outline-offset: -2px;
        border: 2px solid #fff;
        border-radius: 4px;
    }

    .detaillist::-webkit-scrollbar-track {
        background-color: #fff;
    }

    .detaillist::-webkit-scrollbar {
        width: 8px;
        background-color: #f5f5f5;
    }

    .detaillist::-webkit-scrollbar-thumb {
        background-color: #999;
        outline: 2px solid #fff;
        outline-offset: -2px;
        border: 2px solid #fff;
        border-radius: 4px;
    }

    .xhnum {
        font-size: 20px;
        color: #585F67;
        font-weight: 600;
        margin-left: -4px;
        align-items: center;
        line-height: 25px;
    }

    .car-item:hover {
        cursor: pointer;
        background-color: #eaf6fc;
    }

    .top {
        text-align: right;
        justify-content: space-around;
        display: flex;
        align-items: center;

        .xinhao {
            font-weight: bold;
            margin-bottom: 5px;
            width: 100px;
            overflow: hidden; //超出的文本隐藏
            text-overflow: ellipsis; //溢出用省略号显示
            white-space: nowrap; //溢出不换行
        }

        .sim {
            color: #99a0a9;
            font-size: 0.75rem;
            margin-left: 15px;
        }

        .caring {
            display: flex;
            align-items: center;

            .number {
                font-size: 30px;
                font-weight: bold;
                margin-right: 3px;
            }

            .caricon {
                display: flex;
                flex-direction: column;
                text-align: left;

                .car {
                    width: 18px;
                    height: 18px;

                    img {
                        width: 100%;
                        height: 100%;
                    }
                }
            }
        }

        .btns {
            .el-button {
                border-radius: 12px;
                padding: 4px 12px;
            }
        }
    }

    .sort {
        display: flex;
        line-height: 40px;
        padding: 4px;

        input {
            height: 32px
        }
    }

    .bottom {
        display: flex;
        margin-right: 6px;

        div {
            display: flex;
            margin-top: 10px;

            .tit {
                font-size: 12px;
                color: #9b9b9b;
                line-height: 12px;
            }

            .num {
                font-size: 14px;
                margin-top: -2px;
                color: #727880;
                padding-right: 10px;
                padding-left: 4px;
            }
        }
    }

    .caritem {
        position: absolute;
        background: hsla(0, 0%, 100%, 0.8);
        left: 310px;
        z-index: 200;
        display: flex;
        flex-direction: column;
        border: 1px solid #e7e7e7;

        .headtop {
            padding: 14px 14px 0;
        }

        .carloaction {
            width: 100%;
            height: 80px;
            color: rgba(0, 0, 0, 0.85);

            &:last-child {
                border-bottom: 0px;
            }

            div {
                padding: 14px;
                display: flex;
                flex-direction: column;
            }

            .label {
                color: #9b9b9b;
                font-size: 0.75rem;
                width: 33px;
                display: inline-block;
            }
        }

        .hoves:hover {
            color: #4a91e2;
            font-weight: bold;
            cursor: pointer;
        }
    }

    .container-header {
        display: flex;
        justify-content: space-between;
        margin-left: 6px;
        margin-right: 6px;
    }

    .trip-item {
        color: #1B1D1F;
        font-weight: 600;
        font-size: 14px;
        padding: 0 !important;
        padding-top: 10px !important;
    }

    .trip-min-speed {
        background-color: #EEE;
        display: flex;
        justify-content: flex-end !important;
        color: #9DA2A7;
        font-size: 12px;
        padding: 2px 4px !important;
        margin-top: 6px;
        border-radius: 6px;
    }

    .el-tabs__header {
        border: none;
        width: 100%;
    }

    .status-car-driving {
        background-color: #EAF6FC;
        color: #59B4D1;
        padding: 8px 12px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 600;
    }

    .status-car-pak {
        background-color: #E6F9EF;
        color: #7DC066;
        padding: 8px 12px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 600;
    }


    .detailHead {
        background: rgb(246, 246, 246);
        padding-top: 0;

    }

    .pageList {
        min-height: 125px;
        max-height: 64vh;
        overflow: auto;
        overflow-x: hidden;
        margin-top: 6px;
    }

    .detaillist {
        height: 73vh;
        overflow: auto;
        overflow-x: hidden;

        .eventtop {
            width: 100%;
            text-align: center;
        }

        header {
            text-align: center;
            font-size: 0.75em;
            display: inline-block;
            color: #fff;
            padding: 8px 32px;
            margin: 12px 0;
            background: #99a0a9;
            border-radius: 32px;
        }
    }

    .detaillistEvent {
        height: 62vh;
        overflow: auto;
        overflow-x: hidden;

        .eventtop {
            width: 100%;
            text-align: center;
        }

        header {
            text-align: center;
            font-size: 0.75em;
            display: inline-block;
            color: #fff;
            padding: 8px 32px;
            margin: 12px 0;
            background: #99a0a9;
            border-radius: 32px;
        }
    }

    .event-cate {
        margin-top: 17px;
        padding-left: 10px;
    }

    .el-collapse-item {
        border: 1px solid #EEEEEE;
        border-radius: 16px;
        margin: 12px 12px 12px 4px;
        box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
    }

    .el-collapse-item__header {
        height: 100px !important;
        line-height: 100px !important;
        border: 0px !important;
        border-radius: 12px;

        .detail {
            display: flex;
            flex-direction: column;
            height: 100px !important;
            line-height: 100px !important;
            position: relative;
            width: 100%;
            padding: 0 12px;


            div {
                display: flex;
                padding: 10px 0 0 0;
                justify-content: space-between;
                align-items: center;
                height: 20px;
                line-height: 20px;

                .line {
                    flex: 1;
                    height: 2px;
                    background-color: #b2e0f5;
                    position: relative;
                }

                .iconTips {
                    position: absolute;
                    left: 140px;
                    margin-top: -8px;

                    .tipsbox {
                        display: flex;

                        .el-badge__content {
                            border: none !important;
                        }

                        .svg {
                            width: 20px;
                            height: 20px;
                        }

                        .item {
                            position: absolute;
                            top: -10px;
                            left: 11px;
                        }
                    }
                }

                .circle {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #4a91e2;
                    margin: 0 5px;
                }

                .green {
                    background: #5bc162;
                }
            }
        }
    }

    .detail-trip {
        color: #9DA2A7;
        font-size: 12px;
    }

    .section {
        cursor: pointer;

        .section-div {
            display: flex;
            margin: 0 12px 0 18px;
            margin-top: -2px;
        }

        .cicle {
            width: 8px;
            height: 8px;
            margin-top: 5px;
            margin-right: 10px;
            border-radius: 50%;
            // background: #4a91e2;
        }

        .title {
            width: 100%;
            padding: 6px 20px;
            display: flex;
            flex-direction: column;

            .time {
                color: #9DA2A7;
                font-size: 12px;
            }
        }
    }

    .evnttrip {

        .events {
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            margin-left: 24px;
            margin-right: 10px;

            .leftbox {
                display: flex;

                .left {
                    .eventBar {
                        width: 5px;
                        background: #9b9b9b;
                        height: 100%;
                        border-radius: 8px;
                    }
                }

                .last {
                    display: flex;
                    align-items: center;
                }

                .right {
                    flex-direction: column;
                    border-radius: 8px;
                    margin-top: 23px;
                    font-size: 14px;
                    color: #898F96;

                    .time {
                        box-shadow: rgba(100, 100, 111, 0.6) 0px 0.2px 6px 0px;
                        padding: 10px;
                        font-size: 16px;
                        border-radius: 10px;

                    }

                    .event-type {
                        font-size: 14px;
                        padding-left: 10px;
                    }

                    .event-type:hover {
                        font-weight: 500;
                    }

                    .event-cate {
                        font-size: 0.75em;
                        color: #9b9b9b;
                    }
                }

                .right:hover {
                    color: #8301A3;
                }
            }
        }

        .events:hover {
            .right {
                color: #8301A3;
            }
        }

        &:last-child {
            border: 0px;
        }
    }

    .evnttrip:hover {
        background: #FFF2F2;
        border-radius: 8px;
    }

    .isactive {
        background: #f6f6f6;
        color: #4a91e2;
        font-weight: 500;
    }
}

.img-map-user-trip-detail-item {
    display: flex;
    padding-right: 6px;
}

.img-map-user-trip-detail-item-img {
    padding-right: 2px;
    margin-top: 1.4px;
    width: 13px;
    height: 13px;
}

.noti-trip {
    display: flex;
    justify-content: space-between;
    margin-bottom: 14px;
    margin-right: 16px;
    margin-left: 16px;
    margin-top: 60px;
}

.noti-trip-img {
    width: 55px;
    height: 55px;
}

.noti-trip-text {
    width: 100%;
    padding-left: 10px;
}

.noti-trip-item {
    color: #1B1D1F;
    font-size: 14px;
    font-weight: 500;
}

.all-car {
    display: flex;
    background-color: #EEEEEE;
    justify-content: center;
    align-items: center;
    padding: 8px 10px;
    border-radius: 8px;
    margin-right: 10px;
    font-size: 16px;
}

.all-car-text {
    color: #1B1D1F;
}

.all-car-number {
    color: #434C57;
    background-color: #FFFFFF;
    padding: 4px 8px 4px 8px;
    margin-left: 4px;
    border-radius: 6px;
    font-weight: 600;
}

.all-car-driving {
    display: flex;
    background-color: #EAF6FC;
    justify-content: center;
    align-items: center;
    padding: 8px 10px;
    border-radius: 8px;
    margin-right: 10px;
    font-size: 16px;
}

.trip-item-title {
    font-size: 20px;
    font-weight: 600;
    color: #1B1D1F;
    background: #E0E3EE;
    padding: 20px !important;
    margin-right: -12px;
    margin-left: -12px;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
}

.video-live-dialog {
    .el-dialog {
        border-radius: 12px;
    }
}

.all-car-driving-text {
    color: #4a91e2;
}

.left-col-solid {
    background-color: #b2e0f5;
    height: 58px;
    width: 2px;
    position: relative;
    left: 10px;
}

.all-car-driving-number {
    background-color: #FFFFFF;
    padding: 4px 8px 4px 8px;
    margin-left: 4px;
    border-radius: 6px;
    color: #0B4296;
    font-weight: 600;
}

.all-car-pak {
    display: flex;
    background-color: #E6F9EF;
    justify-content: center;
    align-items: center;
    padding: 8px 10px;
    border-radius: 8px;
    margin-right: 10px;
    font-size: 16px;
}

.all-car-pak-text {
    color: #7DC066;
}

.all-car-pak-number {
    background-color: #FFFFFF;
    padding: 4px 8px 4px 8px;
    margin-left: 4px;
    border-radius: 6px;
    color: #36A410;
    font-weight: 600;

}

.noti-trip-sub-item {
    color: #9DA2A7;
    font-size: 14px;
    font-weight: 500;
}

.infowindows {
    display: flex;

    .content {
        padding: 0 12px;

        .timedata {
            display: flex;
        }

        .type {
            font-size: 1.14285em;
            font-weight: 500;
            color: #344254;
        }

        .time {
            font-size: 0.85714em;
        }

        .duration {
            color: #9b9b9b;
        }
    }
}

.xhnum {
    padding-left: 5px;
    color: #727880;
    font-size: 14px;
}

.sim {
    padding-left: 5px;
    color: #727880;
    font-size: 14px;
}

.detail-container {
    min-width: 335px;
    width: 335px;
}

.detail-bar {
    width: 30%;
}

.dialog-live-stream {
    div {
        border-radius: 12px;
    }
}

.profile-container {

    .el-icon-error {
        font-size: 60px !important;
    }
}


.btn-refresh {
    margin: 0 auto;
    margin-top: 20px;
    border: 1px solid #0B4296 !important;
    color: #0B4296 !important;
}

.wakeupfail {
    height: 400px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    i {
        font-size: 100px;
    }

    .title {
        margin-top: 18px;
        font-size: 25px;
        margin-left: 10px;

        .tips {
            margin-right: 20px;
        }
    }
}

.title-bottom-section {
    padding-top: 10px
}

.el-loading-spinner .el-loading-text {
    font-size: 25px;
}

.lane-color {
    width: 14px;
    background-color: #f0f2f5;
    margin-top: -10px;
    margin-bottom: -10px
}

.detail-map-container {
    position: absolute;
    bottom: 0;
    background-color: #EEE;
    z-index: 100;
    height: 40px;
    display: flex;
    padding: 20px;
    flex-direction: row-reverse;
}

.detail-map-user-driver {
    min-width: 520px;
    background-color: #fff;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    position: absolute;
    bottom: 27px;
    left: 5%;
    display: flex;
    justify-content: space-between;
    box-shadow: rgba(100, 100, 111, 0.2) 4px 7px 29px 4px;
    cursor: text;
}

.detail-map-user-driver:hover {
    opacity: 0.65;
}


.img-map-user-name {
    color: #1B1D1F;
    font-size: 15px;
    font-weight: 600;
    padding-bottom: 11px;
}

.img-map-user-trip-detail {
    font-size: 14px;
    display: flex;
    color: #727880
}

.img-map-item {
    display: flex;
}

.detail-map-user-driver-live {
    background-color: #FFF2F2;
    padding: 6px 10px;
    border: 1px solid #C6C8CB;
    border-radius: 4px;
    color: #386CF2;
    cursor: pointer;
    margin-right: 10px;
    display: flex;
    height: 22px;
}

.status-camera {
    input {
        background-color: #E4E4E4 !important;
        color: #585F67 !important;
        height: 36px !important;
    }
}

.detail-map-user-driver-contact {
    background-color: #D8F1FF;
    padding: 6px 10px;
    border: 1px solid #C6C8CB;
    border-radius: 4px;
    color: #386CF2;
    cursor: pointer;
    margin-right: 10px;
    display: flex;
    height: 22px;
}

.detail-map-user-driver-contact:hover {
    .detail-map-user-driver-contact {
        opacity: 1 !important;
    }
}

.detail-map-user-driver-live:hover {
    .detail-map-user-driver-contact {
        opacity: 1 !important;
    }
}



.img-map-user-driver {
    display: flex;
}

.img-map-user-driver-container {
    padding-left: 14px;
}

.img-map-user-name {
    color: #1B1D1F;
    font-size: 15px;
    font-weight: 600;
    padding-bottom: 11px;
}

.img-map-user-trip-detail {
    font-size: 14px;
    display: flex;
    color: #727880
}


.img-map-contact-item {
    display: flex;
}

.img-map-contact {
    display: flex;
    align-items: center;
}

.header-fleet-name {
    margin-right: 10px;
    font-size: 16px;
    font-weight: 600;
    color: #585F67;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    background-color: #fff;
    padding: 10px;
    border-radius: 8px;
}

.img-map-contact-item-img {
    width: 17px;
    height: 20px;
    margin-right: 2px;
}

.video-js {
    height: 490px !important;
}

.video-js .vjs-tech {
    border-bottom-left-radius: 12px !important;
    border-bottom-right-radius: 12px !important;

}

.vjs-fluid {
    border-bottom-left-radius: 12px !important;
    border-bottom-right-radius: 12px !important;
}

.vjs-control-bar {
    border-bottom-left-radius: 12px !important;
    border-bottom-right-radius: 12px !important;
}

.img-map-contact-item-text {
    font-size: 15px;
    padding-top: 2px;
    padding-left: 4px;
    font-weight: 500;
    color: #0b4296;
}

.img-map-contact-item-text-contact {
    font-size: 15px;
    padding-top: 2px;
    padding-left: 4px;
    font-weight: 500;
    color: #386CF2;
}

.vjs-play-control {
    background-image: url('../assets/pause-solid.svg') !important;
    margin: 5px !important;
    margin-top: 10px !important;
    margin-left: 10px !important;
    background-repeat: no-repeat !important;
    z-index: 200;
    cursor: pointer;
}

.el-collapse-item__wrap {
    border-radius: 12px;
    height: auto !important;
}

.el-collapse-item__content {
    border-radius: 12px;

    .isactive {
        background-color: #FFF2F2;
        color: #8301A3 !important;
    }

    .evnttrip:hover {
        background: #FFF2F2;
        color: #8301A3 !important;
    }

    .right .event-type:hover {
        color: #8301A3 !important;
    }
}

.video-js.vjs-fluid {
    height: 490px !important
}

.vjs-mute-control {
    background-image: url('../assets/volume-low-solid.svg') !important;
    margin: 5px !important;
    margin-top: 10px !important;
    background-repeat: no-repeat !important;
    z-index: 200;
}

.vjs-fullscreen-control {
    background-image: url('../assets/menusss.svg') !important;
    margin: 5px !important;
    margin-top: 10px !important;
    background-repeat: no-repeat !important;
    z-index: 200;
}

.vjs-big-play-button {
    background-repeat: no-repeat !important;
    z-index: 200;

    .vjs-icon-placeholder {
        display: block !important;
    }
}

.vjs-icon-placeholder {
    display: none !important;
}


.vjs-big-play-button:before {
    display: none;
}

.vjs-volume-level:before {
    display: none;
}

.videotop {
    border-top-left-radius: 12px !important;
    border-top-right-radius: 12px !important;

    span {
        display: inline-block;
        padding: 0 8px;
    }

    .circle {
        width: 8px;
        height: 8px;
        padding: 0;
        border-radius: 8px;
        background: #eb5a43;
        margin-left: 12px;
    }

    .el-button {
        background: transparent;
    }

    display: flex;
    color: #fff;
    padding: 8px;
    background: #000;
    z-index: 1;
    align-items: center;
    justify-content: flex-start;

    .el-button {
        color: #fff;
    }
}

.reweak {
    background: #000;
    z-index: 1;
    text-align: center;
    color: #fff;
}

.gm-style-iw-d {
    overflow: hidden !important;
}

.gm-ui-hover-effect {
    top: -4px !important;
    right: -4px !important;
}

.items {
    .el-icon-arrow-right {
        display: none;
    }

    .el-collapse-item__header {
        padding: 0 !important;
    }
}

.headerEvent-title {
    display: flex;
    background-color: #E0E3EE;
    font-size: 16px;
    font-weight: 600;
    padding: 10px 16px;
    align-items: center;
    justify-content: space-between;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
}

.headerEvent-title-time {
    color: #0B4296;
}

.headerEvent-title-evtLength {
    color: #CF0808;
    padding: 4px 10px;
    background-color: #FFF2F2;
    border-radius: 16px;
}

.EventPickerTime {

    .el-range-input {
        background-color: #fff !important;
    }
}
</style>
