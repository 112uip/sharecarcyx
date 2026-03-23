<template>
  <el-container class="dashboard-layout">
    <el-header class="app-header">
      <div class="logo">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 11L6.5 6.5H17.5L19 11M5 11H3C2.45 11 2 11.45 2 12V16C2 16.55 2.45 17 3 17H4C4.55 17 5 16.55 5 16V15H19V16C19 16.55 19.45 17 20 17H21C21.55 17 22 16.55 22 16V12C22 11.45 21.55 11 21 11H19M5 11H19" stroke="#1d4ed8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="6" cy="14" r="1.5" fill="#1d4ed8"/>
          <circle cx="18" cy="14" r="1.5" fill="#1d4ed8"/>
          <path d="M9 8L10.5 6H13.5L15 8" stroke="#1d4ed8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="title">链享出行</span>
      </div>
      <div class="user-info">
        <el-tag :type="roleTagType" effect="dark" class="role-badge">{{ roleLabel }}</el-tag>
        <span class="username">{{ session.displayName }}</span>
        <el-tag v-if="session.role === 'renter' && renterWallet" type="primary" effect="plain">
          钱包 {{ walletShort }}
        </el-tag>
        <el-button type="danger" link @click="handleLogout">退出登录</el-button>
      </div>
    </el-header>

    <el-container class="main-container">
      <el-aside width="220px" class="side-menu">
        <el-menu :default-active="activeMenu" @select="handleSelectMenu" class="el-menu-vertical">
          <template v-if="session.role === 'renter'">
            <el-menu-item index="renter-auth">
              <el-icon><User /></el-icon>
              <span>资质认证</span>
            </el-menu-item>
            <el-menu-item index="overview">
              <el-icon><DataBoard /></el-icon>
              <span>车型甄选</span>
            </el-menu-item>
            <el-menu-item index="renter-rent">
              <el-icon><Key /></el-icon>
              <span>租车业务</span>
            </el-menu-item>
            <el-menu-item index="renter-history">
              <el-icon><Clock /></el-icon>
              <span>历史订单</span>
            </el-menu-item>
          </template>

          <template v-if="session.role === 'admin'">
            <el-menu-item index="overview">
              <el-icon><DataBoard /></el-icon>
              <span>车型甄选</span>
            </el-menu-item>
            <el-menu-item index="admin-approve">
              <el-icon><Stamp /></el-icon>
              <span>用户审批</span>
            </el-menu-item>
            <el-menu-item index="admin-cars">
              <el-icon><Van /></el-icon>
              <span>车辆管理</span>
            </el-menu-item>
            <el-menu-item index="admin-chain">
              <el-icon><Link /></el-icon>
              <span>汽车存证</span>
            </el-menu-item>
            <el-menu-item index="admin-deposit">
              <el-icon><Coin /></el-icon>
              <span>退押金管理</span>
            </el-menu-item>
          </template>

          <template v-if="session.role === 'dispatcher'">
            <el-menu-item index="overview">
              <el-icon><DataBoard /></el-icon>
              <span>车型甄选</span>
            </el-menu-item>
            <el-menu-item index="dispatcher-maint">
              <el-icon><Tools /></el-icon>
              <span>车辆调度</span>
            </el-menu-item>
          </template>
        </el-menu>
      </el-aside>

      <el-main class="content-area">
        <!-- Overview -->
        <div v-if="activeMenu === 'overview'">
          <el-row :gutter="20" class="stat-cards">
            <template v-if="session.role === 'renter'">
              <el-col :span="12">
                <el-card shadow="hover">
                  <div class="stat-title">我的订单数</div>
                  <div class="stat-value">{{ renterOrderCount }}</div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card shadow="hover">
                  <div class="stat-title">链区块高度</div>
                  <div class="stat-value">{{ systemState?.chainHeight || 0 }}</div>
                </el-card>
              </el-col>
            </template>
            <template v-else>
              <el-col :span="6">
                <el-card shadow="hover">
                  <div class="stat-title">注册用户</div>
                  <div class="stat-value">{{ systemState?.users?.length || 0 }}</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover">
                  <div class="stat-title">订单总数</div>
                  <div class="stat-value">{{ systemState?.orders?.length || 0 }}</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover">
                  <div class="stat-title">维护记录</div>
                  <div class="stat-value">{{ systemState?.maintenanceLogs?.length || 0 }}</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover">
                  <div class="stat-title">链区块高度</div>
                  <div class="stat-value">{{ systemState?.chainHeight || 0 }}</div>
                </el-card>
              </el-col>
            </template>
          </el-row>

          <el-card class="mt-4" shadow="hover" header="车辆状态列表">
            <div class="car-grid" v-loading="loadingCars">
              <el-row :gutter="20">
                <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="car in carsList" :key="car.id">
                  <el-card class="car-card" :body-style="{ padding: '0px' }" shadow="hover" @click="showCarDetail(car)">
                    <div class="car-image-wrapper">
                      <img
                        :key="car.id + '-cover'"
                        :src="getCarImage(car)"
                        class="car-image"
                        :alt="car.model"
                        loading="lazy"
                        decoding="async"
                        @error="handleImageError($event, car)"
                      />
                      <el-tag class="car-status-tag" :type="getCarStatusType(car.status)">
                        {{ getCarStatusLabel(car.status) }}
                      </el-tag>
                    </div>
                    <div class="car-info">
                      <div class="car-model">{{ car.model }}</div>
                      <div class="car-brand-type">{{ car.brand }} | {{ car.type }}</div>
                      <div class="car-plate">{{ car.plate }}</div>
                      <div class="car-detail">
                        <div class="car-info-row">
                          <div class="car-location">
                            <el-icon><Location /></el-icon>
                            {{ car.location }}
                          </div>
                          <div class="car-seats">
                            <el-icon><User /></el-icon>
                            {{ displayCarSeats(car) }}座
                          </div>
                        </div>
                        <div class="car-info-row">
                          <div class="car-battery">
                            <el-progress :percentage="car.battery" 
                              :status="car.battery < 20 ? 'exception' : car.battery < 50 ? 'warning' : 'success'" 
                              :stroke-width="8" />
                          </div>
                          <div class="car-price">
                            <span class="price-value">¥{{ displayCarPrice(car) }}</span>
                            <span class="price-unit">/小时</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
              <el-empty v-if="carsList.length === 0 && !loadingCars" description="暂无车辆数据" />
            </div>
          </el-card>
        </div>

        <!-- Renter: Auth -->
        <el-card v-if="activeMenu === 'renter-auth'" header="实名资质认证" shadow="hover" class="action-card">
          <el-form :model="authForm" label-width="100px" style="max-width: 600px">
            <el-form-item label="真实姓名">
              <el-input v-model="authForm.name" />
            </el-form-item>
            <el-form-item label="身份证号">
              <el-input v-model="authForm.idCard" />
            </el-form-item>
            <el-form-item label="驾驶证号">
              <el-input v-model="authForm.driverLicense" />
            </el-form-item>
            <el-form-item label="身份证照片">
              <div style="display: flex; gap: 16px; align-items: flex-start;">
                <div>
                  <el-upload
                    class="photo-uploader"
                    :auto-upload="false"
                    :show-file-list="false"
                    :on-change="(file) => { uploadAuthPhotos(file.raw, 'idCardPhoto').then(f => authPhotos.idCardPhoto = f).catch(e => ElMessage.error(e.message)) }"
                    accept="image/*"
                  >
                    <img v-if="authPhotos.idCardPhoto" :src="`/users/photos/${authPhotos.idCardPhoto}`" class="photo-preview" />
                    <div v-else class="photo-placeholder">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8c939d" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                    </div>
                  </el-upload>
                  <div class="upload-tip">正面</div>
                </div>
                <div>
                  <el-upload
                    class="photo-uploader"
                    :auto-upload="false"
                    :show-file-list="false"
                    :on-change="(file) => { uploadAuthPhotos(file.raw, 'idCardBackPhoto').then(f => authPhotos.idCardBackPhoto = f).catch(e => ElMessage.error(e.message)) }"
                    accept="image/*"
                  >
                    <img v-if="authPhotos.idCardBackPhoto" :src="`/users/photos/${authPhotos.idCardBackPhoto}`" class="photo-preview" />
                    <div v-else class="photo-placeholder">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8c939d" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                    </div>
                  </el-upload>
                  <div class="upload-tip">背面</div>
                </div>
              </div>
            </el-form-item>
            <el-form-item label="驾驶证照片">
              <el-upload
                class="photo-uploader"
                :auto-upload="false"
                :show-file-list="false"
                :on-change="(file) => { uploadAuthPhotos(file.raw, 'driverLicensePhoto').then(f => authPhotos.driverLicensePhoto = f).catch(e => ElMessage.error(e.message)) }"
                accept="image/*"
              >
                <img v-if="authPhotos.driverLicensePhoto" :src="`/users/photos/${authPhotos.driverLicensePhoto}`" class="photo-preview" />
                <div v-else class="photo-placeholder">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8c939d" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                </div>
              </el-upload>
              <div class="upload-tip">请上传驾驶证正面照片</div>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitIdentity" :loading="authUploading">提交认证信息</el-button>
            </el-form-item>
          </el-form>
          <div v-if="myUserId" class="mt-4 p-4 bg-blue-50 rounded">
            您的系统用户ID: <strong>{{ myUserId }}</strong> (请记下此ID用于后续操作)
          </div>
        </el-card>

        <!-- Renter: Rent -->
        <div v-if="activeMenu === 'renter-rent'">
          <el-card shadow="hover" header="预约车辆" class="mb-4">
            <el-form label-width="80px">
              <el-form-item label="支付钱包">
                <el-input :model-value="walletDisplay" disabled />
              </el-form-item>
              <el-form-item>
                <el-button plain @click="connectWallet">
                  {{ renterWallet ? '重新连接 MetaMask' : '连接 MetaMask 钱包' }}
                </el-button>
              </el-form-item>
              <el-form-item label="用户ID">
                <el-input v-model="myUserId" placeholder="请先完成资质认证获取ID" />
              </el-form-item>
              <el-form-item label="选择车辆">
                <el-select v-model="rentForm.carId" style="width: 100%">
                  <el-option v-for="car in availableCars" :key="car.id" :label="`${car.id} - ${car.model} (${car.location})`" :value="car.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="租用时长">
                <div class="rent-hours-inline">
                  <el-input-number v-model="rentForm.hours" :min="1" :max="48" />
                  <span class="rent-hours-unit">小时</span>
                </div>
              </el-form-item>
              <el-form-item label="支付金额">
                <el-input :model-value="paymentPreview" disabled />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="createOrder">创建订单</el-button>
              </el-form-item>
            </el-form>
          </el-card>
          <el-card shadow="hover" header="订单操作">
            <el-form label-width="80px">
              <el-form-item label="订单ID">
                <el-input v-model="currentOrderId" placeholder="创建订单后自动填入" />
              </el-form-item>
              <el-form-item v-if="currentOrderId && currentOrderEscrowTxHash" label="托管状态">
                <el-tag :type="currentOrderEscrowStateTagType" size="small">
                  {{ currentOrderEscrowStateLabel }}
                </el-tag>
                <span v-if="currentOrderEscrowTxHash" style="margin-left: 8px; font-size: 11px; color: #909399;">
                  押金TX：{{ currentOrderEscrowTxHash.slice(0, 10) }}...
                </span>
              </el-form-item>
              <el-form-item>
                <div class="order-action-row">
                  <el-button type="success" @click="pickupCar" :disabled="!currentOrderId">取车存证</el-button>
                  <el-button type="warning" @click="reportIssue" :disabled="!currentOrderId">上报故障</el-button>
                  <el-button type="primary" @click="returnCar" :disabled="!currentOrderId">还车结算</el-button>
                </div>
              </el-form-item>
            </el-form>
          </el-card>
        </div>

        <!-- Renter: History -->
        <el-card v-if="activeMenu === 'renter-history'" shadow="hover" header="我的订单历史">
          <div class="mb-4">
            <el-button @click="loadMyOrders">查询我的订单记录</el-button>
          </div>
          <el-table :data="myOrders" style="width: 100%">
            <el-table-column prop="id" label="订单ID" min-width="190" />
            <el-table-column prop="carId" label="车辆ID" width="100" />
            <el-table-column prop="hours" label="时长" width="80" />
            <el-table-column prop="status" label="订单状态" width="120">
              <template #default="{ row }">
                <el-tag :type="orderStatusType(row.status)">{{ orderStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="还车结果" width="130">
              <template #default="{ row }">
                <el-tag :type="row.returnedSuccessfully ? 'success' : 'warning'">
                  {{ row.returnedSuccessfully ? '已还车成功' : '未还车完成' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="finalFee" label="结算费用" width="110">
              <template #default="{ row }">
                {{ row.finalFee ?? '-' }}
              </template>
            </el-table-column>
            <el-table-column label="退押金状态" width="160">
              <template #default="{ row }">
                <el-tag
                  v-if="row.depositRefundRequested"
                  :type="depositRefundStatusTagType(row.depositRefundStatus)"
                  size="small"
                >
                  {{ depositRefundStatusLabel(row.depositRefundStatus) }}
                </el-tag>
                <span v-else-if="row.status === 'completed' && !row.depositRefundRequested" style="color: #909399;">—</span>
                <div v-if="row.depositRefundStatus === 'completed' && row.depositEthAmount" style="margin-top: 4px;">
                  <span style="font-size: 11px; color: #67c23a;">
                    +{{ row.depositEthAmount?.toFixed(5) }} ETH
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === 'completed' && !row.depositRefundRequested && row.deposit > 0"
                  size="small"
                  type="warning"
                  @click="openDepositRefundApplyDialog(row)"
                >
                  申请退押金
                </el-button>
                <span v-else-if="row.depositRefundRequested" style="color: #909399; font-size: 12px;">
                  {{ row.depositRefundStatus === 'completed' ? '已退款' : row.depositRefundStatus === 'pending_admin' ? '审核中' : '已拒绝' }}
                </span>
                <span v-else style="color: #c0c4cc;">—</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- Renter: Deposit Refund Apply Dialog -->
        <el-dialog v-model="depositRefundApplyVisible" title="申请退押金" width="480px" align-center>
          <div v-if="depositRefundApplyOrder" class="deposit-refund-apply">
            <el-descriptions :column="1" border class="mb-4">
              <el-descriptions-item label="订单ID">{{ depositRefundApplyOrder.id }}</el-descriptions-item>
              <el-descriptions-item label="押金金额">
                <span style="color: #f56c6c; font-weight: bold;">¥{{ depositRefundApplyOrder.deposit || 0 }}</span>
              </el-descriptions-item>
            </el-descriptions>
            <el-form :model="depositRefundApplyForm" label-width="100px">
              <el-form-item label="退押金原因">
                <el-select v-model="depositRefundApplyForm.reason" placeholder="请选择退押金原因" style="width: 100%">
                  <el-option label="正常还车退押金" value="正常退押金" />
                  <el-option label="提前取消订单" value="提前取消订单" />
                  <el-option label="其他原因" value="其他原因" />
                </el-select>
              </el-form-item>
              <el-form-item label="补充说明">
                <el-input
                  v-model="depositRefundApplyForm.note"
                  type="textarea"
                  :rows="3"
                  placeholder="如有其他说明，请在此填写（可选）"
                />
              </el-form-item>
            </el-form>
            <el-alert type="info" :closable="false" description="提交后，管理员将审核您的退押金申请，通过后押金将退还至您的钱包。" />
          </div>
          <template #footer>
            <el-button @click="depositRefundApplyVisible = false">取消</el-button>
            <el-button type="primary" @click="submitDepositRefundApply" :loading="depositRefundApplySubmitting">
              提交申请
            </el-button>
          </template>
        </el-dialog>

        <!-- Admin: Approve -->
        <el-card v-if="activeMenu === 'admin-approve'" header="审批用户资质" shadow="hover" class="action-card">
          <el-table :data="pendingUsers" style="width: 100%">
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="idCard" label="身份证号" min-width="160" />
            <el-table-column label="证件照片" width="320">
              <template #default="{ row }">
                <div class="review-photos">
                  <el-popover placement="top" :width="280" trigger="hover">
                    <template #reference>
                      <div class="photo-thumb">
                        <img v-if="row.idCardPhoto" :src="`/users/photos/${row.idCardPhoto}`" />
                        <span v-else class="no-photo">无</span>
                      </div>
                    </template>
                    <div class="photo-popover">
                      <div class="popover-title">身份证照片</div>
                      <img v-if="row.idCardPhoto" :src="`/users/photos/${row.idCardPhoto}`" class="popover-img" />
                      <div v-else class="popover-no-photo">未上传</div>
                    </div>
                  </el-popover>
                  <el-popover placement="top" :width="280" trigger="hover">
                    <template #reference>
                      <div class="photo-thumb">
                        <img v-if="row.driverLicensePhoto" :src="`/users/photos/${row.driverLicensePhoto}`" />
                        <span v-else class="no-photo">无</span>
                      </div>
                    </template>
                    <div class="photo-popover">
                      <div class="popover-title">驾驶证照片</div>
                      <img v-if="row.driverLicensePhoto" :src="`/users/photos/${row.driverLicensePhoto}`" class="popover-img" />
                      <div v-else class="popover-no-photo">未上传</div>
                    </div>
                  </el-popover>
                  <el-popover placement="top" :width="280" trigger="hover">
                    <template #reference>
                      <div class="photo-thumb">
                        <img v-if="row.idCardBackPhoto" :src="`/users/photos/${row.idCardBackPhoto}`" />
                        <span v-else class="no-photo">无</span>
                      </div>
                    </template>
                    <div class="photo-popover">
                      <div class="popover-title">身份证背面</div>
                      <img v-if="row.idCardBackPhoto" :src="`/users/photos/${row.idCardBackPhoto}`" class="popover-img" />
                      <div v-else class="popover-no-photo">未上传</div>
                    </div>
                  </el-popover>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="id" label="用户ID" min-width="200" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="approveUser(row.id)">通过</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="pendingUsers.length === 0" description="暂无待审批申请" />
        </el-card>

        <!-- Admin: Car Management -->
        <el-card v-if="activeMenu === 'admin-cars'" header="车辆管理" shadow="hover" class="action-card">
          <!-- 新增车辆表单 -->
          <el-form :model="newCarForm" :inline="true" class="mb-4 car-add-form">
            <el-form-item label="ID">
              <el-input v-model="newCarForm.id" placeholder="留空自动生成" style="width:110px" />
            </el-form-item>
            <el-form-item label="车型">
              <el-input v-model="newCarForm.model" placeholder="如 BYD Dolphin" style="width:150px" />
            </el-form-item>
            <el-form-item label="品牌">
              <el-input v-model="newCarForm.brand" placeholder="如 比亚迪" style="width:110px" />
            </el-form-item>
            <el-form-item label="类型">
              <el-input v-model="newCarForm.type" placeholder="如 小型纯电轿车" style="width:150px" />
            </el-form-item>
            <el-form-item label="牌照">
              <el-input v-model="newCarForm.plate" placeholder="如 粤A12345" style="width:110px" />
            </el-form-item>
            <el-form-item label="电量%">
              <el-input-number v-model="newCarForm.battery" :min="0" :max="100" :controls-position="'right'" style="width:120px" />
            </el-form-item>
            <el-form-item label="座位">
              <el-input-number v-model="newCarForm.seats" :min="1" :max="9" :controls-position="'right'" style="width:120px" />
            </el-form-item>
            <el-form-item label="价格/时">
              <el-input-number v-model="newCarForm.pricePerHour" :min="1" :controls-position="'right'" style="width:130px" />
            </el-form-item>
            <el-form-item label="位置">
              <el-input v-model="newCarForm.location" placeholder="如 南山科技园" style="width:140px" />
            </el-form-item>
            <el-form-item label="初始状态">
              <el-select v-model="newCarForm.status" style="width:110px">
                <el-option label="可用" value="available" />
                <el-option label="维护中" value="maintenance" />
              </el-select>
            </el-form-item>
            <el-form-item label="车辆图片">
              <el-upload
                :before-upload="handlePhotoSelect"
                :auto-upload="false"
                :show-file-list="false"
                accept="image/jpeg,image/png,image/gif,image/webp"
                style="display:inline-flex;align-items:center;"
              >
                <template #trigger>
                  <el-button size="small">
                    {{ pendingPhotoFile ? pendingPhotoFile.name : '选择图片' }}
                  </el-button>
                </template>
                <el-button v-if="pendingPhotoFile" size="small" type="danger" @click.stop="pendingPhotoFile = null" style="margin-left:6px;">
                  清除
                </el-button>
              </el-upload>
              <span v-if="pendingPhotoFile" style="margin-left:8px;font-size:12px;color:#67c23a;">{{ pendingPhotoFile.name }}</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="addCar">录入车辆</el-button>
            </el-form-item>
          </el-form>

          <!-- 车辆列表 -->
          <el-table :data="allCars" style="width: 100%" v-loading="loadingCars">
            <el-table-column prop="id" label="ID" width="90" />
            <el-table-column prop="model" label="车型" min-width="130" />
            <el-table-column prop="brand" label="品牌" width="80" />
            <el-table-column prop="type" label="类型" min-width="130" />
            <el-table-column prop="plate" label="牌照" width="100" />
            <el-table-column prop="battery" label="电量%" width="75">
              <template #default="{ row }">
                <el-progress :percentage="row.battery" :stroke-width="8"
                  :status="row.battery < 20 ? 'exception' : row.battery < 50 ? 'warning' : 'success'" />
              </template>
            </el-table-column>
            <el-table-column prop="seats" label="座位" width="60" />
            <el-table-column prop="pricePerHour" label="¥/时" width="70" />
            <el-table-column prop="location" label="位置" min-width="110" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="getCarStatusType(row.status)" size="small">{{ getCarStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="openEditCar(row)">编辑</el-button>
                <el-button type="danger" size="small" @click="removeCar(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="allCars.length === 0 && !loadingCars" description="暂无车辆数据" />
        </el-card>

        <!-- Admin: Car Evidence -->
        <el-card v-if="activeMenu === 'admin-chain'" header="汽车存证数据" shadow="hover">
          <el-alert
            title="存证说明"
            type="info"
            :closable="false"
            class="mb-4"
            description="以下数据记录了每次取车时的车辆状态快照，包括外观照片哈希和IoT设备数据（电量、GPS等），确保车况可追溯、纠纷可仲裁。所有数据均已上链存证。"
          />
          <el-button type="primary" size="small" @click="loadCarEvidence" class="mb-4">刷新存证数据</el-button>
          <el-table :data="carEvidenceList" style="width: 100%" v-loading="loadingEvidence" max-height="600">
            <el-table-column prop="orderId" label="订单ID" min-width="180" show-overflow-tooltip />
            <el-table-column prop="carId" label="车辆ID" width="100" />
            <el-table-column prop="carModel" label="车型" min-width="120" />
            <el-table-column prop="carPlate" label="车牌" width="100" />
            <el-table-column prop="userName" label="租车人" width="100" />
            <el-table-column prop="pickupPhotoHash" label="取车照片哈希" min-width="160">
              <template #default="{ row }">
                <span class="hash-text" v-if="row.pickupPhotoHash">{{ row.pickupPhotoHash }}</span>
                <span v-else style="color: #909399;">—</span>
              </template>
            </el-table-column>
            <el-table-column prop="pickupIot" label="取车IoT数据" min-width="140">
              <template #default="{ row }">
                <el-tag size="small" type="success" v-if="row.pickupIot">{{ row.pickupIot }}</el-tag>
                <span v-else style="color: #909399;">—</span>
              </template>
            </el-table-column>
            <el-table-column prop="returnPhotoHash" label="还车照片哈希" min-width="160">
              <template #default="{ row }">
                <span class="hash-text" v-if="row.returnPhotoHash">{{ row.returnPhotoHash }}</span>
                <span v-else style="color: #909399;">—</span>
              </template>
            </el-table-column>
            <el-table-column prop="returnIot" label="还车IoT数据" min-width="140">
              <template #default="{ row }">
                <el-tag size="small" type="warning" v-if="row.returnIot">{{ row.returnIot }}</el-tag>
                <span v-else style="color: #909399;">—</span>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="存证时间" width="170">
              <template #default="{ row }">
                {{ formatTime(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="订单状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getOrderStatusType(row.status)" size="small">
                  {{ getOrderStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="issueReported" label="故障" width="80">
              <template #default="{ row }">
                <el-tag type="danger" size="small" v-if="row.issueReported">有</el-tag>
                <span v-else style="color: #67c23a;">无</span>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="carEvidenceList.length === 0 && !loadingEvidence" description="暂无存证数据" class="mt-4" />
        </el-card>

        <!-- Admin: Deposit Refund Management -->
        <el-card v-if="activeMenu === 'admin-deposit'" header="退押金管理" shadow="hover" class="action-card">
          <el-alert type="info" :closable="false" class="mb-4">
            退押金管理：审核用户正常还车后的押金退还申请
          </el-alert>
          <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <el-button type="primary" size="small" @click="loadDepositRefundRequests">
              刷新列表
            </el-button>
            <el-button
              v-if="props.session.role === 'admin'"
              size="small"
              :type="renterWallet ? 'success' : 'warning'"
              @click="connectWallet"
            >
              {{ renterWallet ? `已连接: ${formatWallet(renterWallet)}` : '连接 MetaMask（管理员退款用）' }}
            </el-button>
            <span v-if="renterWallet && props.session.role === 'admin'" style="font-size: 12px; color: #67c23a;">
              ✓ 可进行退押金审核
            </span>
            <span v-else-if="props.session.role === 'admin'" style="font-size: 12px; color: #e6a23c;">
              ⚠ 连接钱包后才可审核退押金
            </span>
          </div>

          <el-empty v-if="depositRefundRequests.length === 0" description="暂无待处理的退押金申请" />

          <el-table v-else :data="depositRefundRequests" style="width: 100%" v-loading="loadingDepositRefund">
            <el-table-column prop="id" label="订单ID" min-width="180" show-overflow-tooltip />
            <el-table-column label="申请来源" width="110">
              <template #default="{ row }">
                <el-tag v-if="row.issueReported" type="danger" size="small">故障退押金</el-tag>
                <el-tag v-else type="info" size="small">正常退押金</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="carId" label="车辆ID" width="90" />
            <el-table-column prop="userId" label="用户ID" min-width="180" show-overflow-tooltip />
            <el-table-column prop="deposit" label="押金金额" width="100">
              <template #default="{ row }">
                <span style="color: #f56c6c; font-weight: bold;">¥{{ row.deposit || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="depositRefundReason" label="退押金原因" min-width="140">
              <template #default="{ row }">
                {{ row.depositRefundReason || '正常退押金' }}
              </template>
            </el-table-column>
            <el-table-column label="用户钱包" width="180">
              <template #default="{ row }">
                <span v-if="row.user?.walletAddress || row.userWallet" style="font-size: 11px; word-break: break-all;">
                  <el-tag type="success" size="small">{{ (row.user?.walletAddress || row.userWallet).slice(0, 10) }}...{{ (row.user?.walletAddress || row.userWallet).slice(-6) }}</el-tag>
                </span>
                <span v-else style="color: #f56c6c; font-size: 11px;">
                  <el-tag type="danger" size="small">未绑定</el-tag>
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="depositRefundAppliedAt" label="申请时间" width="170">
              <template #default="{ row }">
                {{ formatTime(row.depositRefundAppliedAt) }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="depositRefundStatusTagType(row.depositRefundStatus)" size="small">
                  {{ depositRefundStatusLabel(row.depositRefundStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="ETH退款" width="220">
              <template #default="{ row }">
                <div v-if="row.depositRefundStatus === 'completed'">
                  <span v-if="row.depositEthAmount" style="color: #67c23a; font-size: 12px;">
                    {{ row.depositEthAmount.toFixed(5) }} ETH
                  </span>
                  <span v-if="row.depositRefundTxHash" style="display: block; font-size: 11px; word-break: break-all;">
                    <a :href="`https://etherscan.io/tx/${row.depositRefundTxHash}`" target="_blank" style="color: #409eff;">
                      {{ formatWallet(row.depositRefundTxHash) }}
                    </a>
                  </span>
                  <span v-if="row.depositEscrowRefundTxHash" style="display: block; font-size: 11px; word-break: break-all;">
                    合约: <a :href="`https://etherscan.io/tx/${row.depositEscrowRefundTxHash}`" target="_blank" style="color: #409eff;">
                      {{ formatWallet(row.depositEscrowRefundTxHash) }}
                    </a>
                  </span>
                  <span v-else-if="!row.depositRefundTxHash" style="color: #909399; font-size: 12px;">—</span>
                </div>
                <span v-else style="color: #c0c4cc;">—</span>
              </template>
            </el-table-column>
            <el-table-column label="审核信息" width="150">
              <template #default="{ row }">
                <span v-if="row.depositRefundProcessedAt" style="font-size: 12px; color: #909399;">
                  {{ row.depositRefundProcessedBy }}<br/>
                  {{ formatTime(row.depositRefundProcessedAt) }}
                </span>
                <span v-else style="color: #c0c4cc;">—</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.depositRefundStatus === 'pending_admin'"
                  size="small"
                  type="primary"
                  @click="openDepositRefundDialog(row)"
                >
                  审核退押金
                </el-button>
                <span v-else style="color: #909399; font-size: 12px;">
                  {{ row.depositRefundStatus === 'completed' ? '已退款' : '已拒绝' }}
                </span>
              </template>
            </el-table-column>
          </el-table>

          <!-- Deposit Refund Dialog -->
          <el-dialog v-model="depositRefundVisible" title="退押金审核" width="560px" align-center>
            <div v-if="depositRefundOrder" class="deposit-refund-detail">
              <el-descriptions :column="1" border class="mb-4">
                <el-descriptions-item label="订单ID">{{ depositRefundOrder.id }}</el-descriptions-item>
                <el-descriptions-item label="车辆ID">{{ depositRefundOrder.carId }}</el-descriptions-item>
                <el-descriptions-item label="用户ID">{{ depositRefundOrder.userId }}</el-descriptions-item>
                <el-descriptions-item label="用户钱包">
                  <span v-if="depositRefundOrder.user?.walletAddress || depositRefundOrder.userWallet">
                    <el-tag type="success">{{ depositRefundOrder.user?.walletAddress || depositRefundOrder.userWallet }}</el-tag>
                  </span>
                  <el-tag v-else type="danger">未绑定钱包</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="退押金原因">{{ depositRefundOrder.depositRefundReason || '正常退押金' }}</el-descriptions-item>
                <el-descriptions-item label="押金金额">
                  <span style="color: #f56c6c; font-weight: bold; font-size: 16px;">¥{{ depositRefundOrder.deposit || 0 }}</span>
                  <span style="color: #67c23a; margin-left: 8px;">≈ {{ ((depositRefundOrder.deposit || 0) / 2500).toFixed(5) }} ETH</span>
                </el-descriptions-item>
                <el-descriptions-item label="申请时间">{{ formatTime(depositRefundOrder.depositRefundAppliedAt) }}</el-descriptions-item>
              </el-descriptions>

              <el-form :model="depositRefundForm" label-width="100px">
                <el-form-item label="审核结论">
                  <el-radio-group v-model="depositRefundForm.approved">
                    <el-radio :value="true" type="success">批准退款</el-radio>
                    <el-radio :value="false" type="danger">拒绝退款</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="处理备注">
                  <el-input
                    v-model="depositRefundForm.note"
                    type="textarea"
                    :rows="3"
                    placeholder="请填写审核意见，如拒绝原因等"
                  />
                </el-form-item>
              </el-form>

              <el-alert
                v-if="depositRefundForm.approved"
                title="退款说明"
                type="success"
                :closable="false"
                :description="`点击「确认提交」后，将弹出 MetaMask 确认转账（约 ${((depositRefundOrder.deposit || 0) / 2500).toFixed(5)} ETH 到用户钱包：${depositRefundOrder.user?.walletAddress || depositRefundOrder.userWallet || '未绑定' }）`"
              />
              <el-alert
                v-else
                title="拒绝说明"
                type="warning"
                :closable="false"
                description="拒绝后，押金将不会退还给用户，请确认操作"
              />
            </div>
            <template #footer>
              <el-button @click="depositRefundVisible = false">取消</el-button>
              <el-button type="primary" @click="submitDepositRefund" :loading="depositRefundSubmitting">
                确认提交
              </el-button>
            </template>
          </el-dialog>
        </el-card>

        <!-- Dispatcher: Maintenance -->
        <el-card v-if="activeMenu === 'dispatcher-maint'" header="车辆调度与维护" shadow="hover" class="action-card">
          <el-card shadow="never" class="mb-4" header="待处理故障工单">
            <el-table :data="dispatcherIssues" style="width: 100%">
              <el-table-column prop="id" label="订单ID" min-width="170" />
              <el-table-column prop="carId" label="车辆ID" width="90" />
              <el-table-column prop="issueType" label="故障类型" width="120">
                <template #default="{ row }">
                  {{ row.issueType || '未分类' }}
                </template>
              </el-table-column>
              <el-table-column prop="issueDetail" label="故障描述" min-width="190" />
              <el-table-column label="操作" width="200">
                <template #default="{ row }">
                  <el-button size="small" type="warning" @click="resolveDispatcherIssue(row.id, 'maintenance', null)">转维护中</el-button>
                  <el-button size="small" type="success" @click="resolveDispatcherIssue(row.id, 'available', null)">处理完成</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="dispatcherIssues.length === 0" description="暂无待处理故障" />
          </el-card>
          <el-form label-width="100px" style="max-width: 500px">
            <el-form-item label="选择车辆">
              <el-select v-model="maintForm.carId" style="width: 100%">
                <el-option v-for="car in carsList" :key="car.id" :label="`${car.id} - 状态: ${getCarStatusLabel(car.status)}`" :value="car.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="执行动作">
              <el-radio-group v-model="maintForm.action">
                <el-radio value="charged">充电/换电</el-radio>
                <el-radio value="repairing">维修保养</el-radio>
                <el-radio value="relocated">调度挪车</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="目标状态">
              <el-select v-model="maintForm.targetStatus" style="width: 100%">
                <el-option label="可用" value="available" />
                <el-option label="维护中" value="maintenance" />
                <el-option label="已预订" value="reserved" />
                <el-option label="使用中" value="in_use" />
              </el-select>
            </el-form-item>
            <el-form-item label="备注说明">
              <el-input v-model="maintForm.note" type="textarea" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitMaintenance">提交维护记录</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-main>

      <el-dialog v-model="carDetailVisible" title="车辆详细信息" width="500px" align-center>
        <div v-if="selectedCar" class="car-detail-dialog">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="车辆型号">{{ selectedCar.model }}</el-descriptions-item>
            <el-descriptions-item label="品牌">{{ selectedCar.brand }}</el-descriptions-item>
            <el-descriptions-item label="类型">{{ selectedCar.type }}</el-descriptions-item>
            <el-descriptions-item label="车牌号">{{ selectedCar.plate }}</el-descriptions-item>
            <el-descriptions-item label="车辆ID">{{ selectedCar.id }}</el-descriptions-item>
            <el-descriptions-item label="当前位置">{{ selectedCar.location }}</el-descriptions-item>
            <el-descriptions-item label="座位数">{{ displayCarSeats(selectedCar) }}座</el-descriptions-item>
            <el-descriptions-item label="电量">
              <el-progress :percentage="selectedCar.battery"
                :status="selectedCar.battery < 20 ? 'exception' : selectedCar.battery < 50 ? 'warning' : 'success'"
                :stroke-width="10" style="width: 200px" />
            </el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="getCarStatusType(selectedCar.status)">{{ getCarStatusLabel(selectedCar.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="价格">
              <span class="dialog-price">¥{{ displayCarPrice(selectedCar) }}</span>/小时
            </el-descriptions-item>
          </el-descriptions>
          <div v-if="selectedCar.description" class="mt-4">
            <strong>车辆描述：</strong>{{ selectedCar.description }}
          </div>
        </div>
        <template #footer>
          <el-button @click="carDetailVisible = false">关闭</el-button>
          <el-button v-if="session.role === 'renter' && selectedCar?.status === 'available'" type="primary" @click="quickRent">立即租车</el-button>
        </template>
      </el-dialog>

      <!-- Admin: Edit Car Dialog -->
      <el-dialog v-model="editCarVisible" title="编辑车辆信息" width="560px" align-center>
        <el-form :model="editCarForm" label-width="90px">
          <el-form-item label="车辆ID">
            <el-input v-model="editCarForm.id" disabled />
          </el-form-item>
          <el-form-item label="车型">
            <el-input v-model="editCarForm.model" />
          </el-form-item>
          <el-form-item label="品牌">
            <el-input v-model="editCarForm.brand" />
          </el-form-item>
          <el-form-item label="类型">
            <el-input v-model="editCarForm.type" />
          </el-form-item>
          <el-form-item label="牌照">
            <el-input v-model="editCarForm.plate" />
          </el-form-item>
          <el-form-item label="电量 %">
            <el-input-number v-model="editCarForm.battery" :min="0" :max="100" :controls-position="'right'" style="width:200px" />
          </el-form-item>
          <el-form-item label="座位数">
            <el-input-number v-model="editCarForm.seats" :min="1" :max="9" :controls-position="'right'" style="width:200px" />
          </el-form-item>
          <el-form-item label="价格/时">
            <el-input-number v-model="editCarForm.pricePerHour" :min="1" :controls-position="'right'" style="width:200px" />
          </el-form-item>
          <el-form-item label="位置">
            <el-input v-model="editCarForm.location" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="editCarForm.status">
              <el-option label="可用" value="available" />
              <el-option label="已预订" value="reserved" />
              <el-option label="使用中" value="in_use" />
              <el-option label="维护中" value="maintenance" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="editCarVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEditCar">保存</el-button>
        </template>
      </el-dialog>

      <!-- Renter: Report Issue Dialog -->
      <el-dialog v-model="reportIssueVisible" title="上报车辆故障" width="520px" align-center>
        <el-form :model="reportIssueForm" label-width="100px">
          <el-form-item label="故障类型" required>
            <el-select v-model="reportIssueForm.issueType" placeholder="请选择故障类型" style="width: 100%">
              <el-option v-for="item in issueTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="故障描述" required>
            <el-input v-model="reportIssueForm.detail" type="textarea" :rows="4" placeholder="请详细描述故障情况，如故障位置、具体表现等" maxlength="500" show-word-limit />
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="reportIssueForm.requestRefund">
              <span>申请退押金</span>
            </el-checkbox>
            <div class="form-tip">勾选后，管理员将审核您的退押金申请</div>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="reportIssueVisible = false">取消</el-button>
          <el-button type="primary" @click="submitReportIssue">确认上报</el-button>
        </template>
      </el-dialog>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api, { uploadCarPhoto } from '../api'
import { depositToEscrow, completeEscrowPayment, refundEscrowPayment, queryEscrowState } from '../contracts/escrow'

const props = defineProps({
  session: Object
})

const emit = defineEmits(['logout'])

const activeMenu = ref('overview')
const systemState = ref({})
const carsList = ref([])
const loadingCars = ref(false)

// Forms
const authForm = reactive({ name: '', idCard: '', driverLicense: '' })
const authPhotos = reactive({ idCardPhoto: '', idCardBackPhoto: '', driverLicensePhoto: '' })
const authUploading = ref(false)
const myUserId = ref('')
const currentOrderId = ref('')
const rentForm = reactive({ carId: '', hours: 1 })
const chainData = ref('')
const carEvidenceList = ref([])
const loadingEvidence = ref(false)
const maintForm = reactive({ carId: '', action: 'charged', targetStatus: 'available', note: '' })
const myOrders = ref([])
const hiddenResolvedIssueIds = ref([])
const renterWallet = ref(props.session.walletAddress || '')
const payeeAddress = import.meta.env.VITE_PAYEE_ADDRESS || '0x000000000000000000000000000000000000dEaD'
const depositEth = Number(import.meta.env.VITE_DEPOSIT_ETH || 0.002)
const rateEthPerHour = Number(import.meta.env.VITE_RATE_ETH_PER_HOUR || 0.001)
const carDetailVisible = ref(false)
const selectedCar = ref(null)

// Renter: Report Issue Dialog
const reportIssueVisible = ref(false)
const reportIssueForm = reactive({
  issueType: '',
  detail: '',
  requestRefund: false
})
const issueTypeOptions = [
  { label: '车辆外观损坏', value: 'scratch' },
  { label: '车辆无法启动', value: 'engine_failure' },
  { label: '刹车系统异常', value: 'brake_failure' },
  { label: '电量显示异常', value: 'battery_issue' },
  { label: '车内设备损坏', value: 'interior_damage' },
  { label: '车门/锁异常', value: 'door_lock_issue' },
  { label: '其他故障', value: 'other' }
]

// Renter: Deposit Refund Apply
const depositRefundApplyVisible = ref(false)
const depositRefundApplyOrder = ref(null)
const depositRefundApplyForm = reactive({
  reason: '正常退押金',
  note: ''
})
const depositRefundApplySubmitting = ref(false)

// Admin: Deposit Refund Management
const depositRefundRequests = ref([])
const depositRefundVisible = ref(false)
const depositRefundOrder = ref(null)
const depositRefundForm = reactive({
  approved: true,
  note: ''
})
const depositRefundSubmitting = ref(false)
const loadingDepositRefund = ref(false)

// Admin car management
const allCars = ref([])
const editCarVisible = ref(false)
const editCarForm = reactive({
  id: '', model: '', brand: '', type: '', plate: '',
  battery: 100, seats: 5, pricePerHour: 35, location: '', status: 'available',
})
const newCarForm = reactive({
  id: '', model: '', brand: '', type: '', plate: '',
  battery: 100, seats: 5, pricePerHour: 35, location: '', status: 'available',
})
const pendingPhotoFile = ref(null)

const showCarDetail = (car) => {
  selectedCar.value = car
  carDetailVisible.value = true
}

const quickRent = () => {
  if (!selectedCar.value) return
  carDetailVisible.value = false
  rentForm.carId = selectedCar.value.id
  rentForm.hours = 1
  activeMenu.value = 'renter-rent'
}

const roleLabel = computed(() => {
  const map = { renter: '租客', admin: '管理员', dispatcher: '调度员' }
  return map[props.session.role] || '未知'
})

const roleTagType = computed(() => {
  const map = { renter: 'success', admin: 'danger', dispatcher: 'warning' }
  return map[props.session.role] || 'info'
})

const availableCars = computed(() => carsList.value.filter(c => c.status === 'available'))
const renterOrderCount = computed(() => {
  if (props.session.role !== 'renter' || !myUserId.value) {
    return 0
  }
  return (systemState.value.orders || []).filter((item) => item.userId === myUserId.value).length
})
const pendingUsers = computed(() => (systemState.value.users || []).filter((item) => item.status === 'pending'))
const dispatcherIssues = computed(() =>
  (systemState.value.orders || [])
    .filter((item) => item.issueReported && item.issueStatus !== 'resolved' && !hiddenResolvedIssueIds.value.includes(item.id))
    .sort((a, b) => (b.issueReportedAt || b.createdAt || 0) - (a.issueReportedAt || a.createdAt || 0))
)
const walletShort = computed(() => formatWallet(renterWallet.value))
const walletDisplay = computed(() => renterWallet.value || '未连接')

// 当前订单的链上托管押金交易哈希
const currentOrderEscrowTxHash = computed(() => {
  if (!currentOrderId.value) return null
  const order = (systemState.value.orders || []).find(o => o.id === currentOrderId.value)
  return order?.escrowDepositTxHash || null
})

// 当前订单的链上托管状态描述
const ESCROW_STATE_LABELS = {
  0: '已托管(待取车)', 1: '使用中', 2: '已完成(已释放)', 3: '已退费', 4: '已取消', null: '未托管'
}
const currentOrderEscrowStateLabel = computed(() => {
  if (!currentOrderId.value) return '无订单'
  const order = (systemState.value.orders || []).find(o => o.id === currentOrderId.value)
  if (!order) return '订单未找到'
  // 若有完成退款的链上哈希，则为已完成/退费态
  if (order.refundStatus === 'completed') return '已退费'
  if (order.escrowCompletedTxHash) return '已完成(已释放)'
  if (order.escrowDepositTxHash) return '已托管(待取车)'
  return '未托管'
})
const currentOrderEscrowStateTagType = computed(() => {
  const label = currentOrderEscrowStateLabel.value
  if (label === '已退费') return 'danger'
  if (label === '已完成(已释放)') return 'success'
  if (label === '已托管(待取车)') return 'warning'
  return 'info'
})

const paymentPreview = computed(() => {
  const total = depositEth + Number(rentForm.hours || 1) * rateEthPerHour
  return `${total.toFixed(4)} ETH（含押金 ${depositEth.toFixed(4)} ETH）`
})
const renterStateStorageKey = computed(() => {
  if (props.session.role !== 'renter') {
    return ''
  }
  return `carshare.renter.state.${props.session.accountId || props.session.username || props.session.token}`
})
const dispatcherIssueStorageKey = computed(() => {
  if (props.session.role !== 'dispatcher') {
    return ''
  }
  return `carshare.dispatcher.resolvedIssues.${props.session.accountId || props.session.username || props.session.token}`
})

const handleLogout = () => {
  emit('logout')
}

const handleSelectMenu = (index) => {
  activeMenu.value = index
  if (index === 'overview') loadState()
  if (index === 'admin-chain') loadCarEvidence()
  if (index === 'admin-deposit') loadDepositRefundRequests()
  if (index === 'admin-approve') loadState()
  if (index === 'dispatcher-maint') loadState()
  if (index === 'admin-cars') loadAllCars()
  if (index === 'renter-history' && myUserId.value) loadMyOrders()
}

const loadState = async () => {
  try {
    loadingCars.value = true
    systemState.value = await api.get('/state')
    carsList.value = await api.get('/cars')
  } catch (error) {
  } finally {
    loadingCars.value = false
  }
}

const loadChain = async () => {
  try {
    const data = await api.get('/chain')
    chainData.value = JSON.stringify(data, null, 2)
  } catch (error) {}
}

const loadCarEvidence = async () => {
  try {
    loadingEvidence.value = true
    const data = await api.get('/admin/car-evidence')
    carEvidenceList.value = data
  } catch (error) {
    ElMessage.error('加载存证数据失败')
  } finally {
    loadingEvidence.value = false
  }
}

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 生成数据哈希值（用于区块链账本风格展示）
const generateDataHash = (input) => {
  if (!input && input !== 0) return '-'
  let hash = 0
  const str = String(input)
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0')
  return `0x${hexHash}${Date.now().toString(16).slice(-8)}`
}

const getOrderStatusType = (status) => {
  const map = { reserved: 'warning', in_use: 'primary', completed: 'success', cancelled: 'info' }
  return map[status] || 'info'
}

const getOrderStatusLabel = (status) => {
  const map = { reserved: '已预订', in_use: '使用中', completed: '已完成', cancelled: '已取消' }
  return map[status] || status || '-'
}

const uploadAuthPhotos = async (file, type) => {
  try {
    const formData = new FormData()
    formData.append(type, file)
    const res = await api.post('/auth/upload-photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return res[type] || res[type.replace('Photo', 'Photo')]
  } catch (error) {
    throw new Error(`上传${type === 'idCardPhoto' ? '身份证' : '驾驶证'}照片失败`)
  }
}

const submitIdentity = async () => {
  try {
    if (!authForm.name || !authForm.idCard || !authForm.driverLicense) {
      ElMessage.warning('请完整填写姓名、身份证号和驾驶证号')
      return
    }
    if (!authPhotos.idCardPhoto || !authPhotos.idCardBackPhoto || !authPhotos.driverLicensePhoto) {
      ElMessage.warning('请上传身份证正面、背面和驾驶证照片')
      return
    }
    const res = await api.post('/auth/submit', {
      ...authForm,
      idCardPhoto: authPhotos.idCardPhoto,
      idCardBackPhoto: authPhotos.idCardBackPhoto,
      driverLicensePhoto: authPhotos.driverLicensePhoto,
      accountId: props.session.accountId
    })
    myUserId.value = res.id
    ElMessage.success('资质认证提交成功，等待管理员审批')
    // 开始轮询检查审批状态
    startApprovalPolling(res.id)
  } catch (error) {
    ElMessage.error(error.message || '提交失败')
  }
}

// 轮询检查审批状态
let approvalPollingTimer = null
const startApprovalPolling = (pendingId) => {
  if (approvalPollingTimer) {
    clearInterval(approvalPollingTimer)
  }
  approvalPollingTimer = setInterval(async () => {
    try {
      const state = await api.get('/state')
      const myUser = (state.users || []).find(u => u.id === pendingId)
      if (myUser && myUser.status === 'approved') {
        myUserId.value = myUser.id
        ElMessage.success(`您的账号已通过审批！`)
        clearInterval(approvalPollingTimer)
        approvalPollingTimer = null
        persistRenterState()
      }
    } catch (e) {
      // 忽略轮询错误
    }
  }, 5000) // 每5秒检查一次
}

onUnmounted(() => {
  if (approvalPollingTimer) {
    clearInterval(approvalPollingTimer)
  }
})

const formatWallet = (address) => {
  if (!address) {
    return ''
  }
  return `${address.slice(0, 8)}...${address.slice(-6)}`
}

const decimalEthToWeiHex = (ethValue) => {
  const [integerPart, decimalPartRaw = ''] = String(ethValue).split('.')
  const decimalPart = decimalPartRaw.padEnd(18, '0').slice(0, 18)
  const wei = BigInt(integerPart || '0') * 10n ** 18n + BigInt(decimalPart || '0')
  return `0x${wei.toString(16)}`
}

const connectWallet = async () => {
  try {
    if (!window.ethereum) {
      throw new Error('未检测到 MetaMask，请先安装插件')
    }
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    if (!accounts || !accounts.length) {
      throw new Error('未获取到钱包地址')
    }
    renterWallet.value = accounts[0]
    ElMessage.success(`MetaMask 连接成功：${formatWallet(renterWallet.value)}`)
    if (!myUserId.value && props.session.role === 'renter' && props.session.accountId) {
      await syncRenterUser()
    }
    if (myUserId.value) {
      await api.post(`/users/${myUserId.value}/wallet`, { walletAddress: renterWallet.value })
    }
  } catch (error) {
    ElMessage.error(error.message || 'MetaMask 连接失败')
  }
}

const restoreRenterState = () => {
  if (props.session.role !== 'renter') {
    return
  }
  try {
    const key = renterStateStorageKey.value
    if (!key) {
      return
    }
    const raw = localStorage.getItem(key)
    if (!raw) {
      return
    }
    const parsed = JSON.parse(raw)
    myUserId.value = parsed.myUserId || ''
    currentOrderId.value = parsed.currentOrderId || ''
    renterWallet.value = parsed.renterWallet || ''
    rentForm.carId = parsed.rentCarId || ''
    rentForm.hours = Number(parsed.rentHours || 1)
  } catch (error) {
  }
}

// 根据 accountId 从服务端同步当前租客的用户ID，确保与后端一致
const syncRenterUser = async () => {
  if (props.session.role !== 'renter' || !props.session.accountId) {
    return
  }
  try {
    const user = await api.get('/users/me', {
      params: { accountId: props.session.accountId },
      suppressError: true
    })
    if (user && user.id) {
      myUserId.value = user.id
      persistRenterState()
    }
  } catch {
    // 未找到关联用户（未提交认证）时忽略
  }
}

const persistRenterState = () => {
  if (props.session.role !== 'renter') {
    return
  }
  try {
    const key = renterStateStorageKey.value
    if (!key) {
      return
    }
    localStorage.setItem(
      key,
      JSON.stringify({
        myUserId: myUserId.value,
        currentOrderId: currentOrderId.value,
        renterWallet: renterWallet.value,
        rentCarId: rentForm.carId,
        rentHours: rentForm.hours
      })
    )
  } catch (error) {
  }
}

const restoreDispatcherIssueState = () => {
  if (props.session.role !== 'dispatcher') {
    return
  }
  try {
    const key = dispatcherIssueStorageKey.value
    if (!key) {
      return
    }
    const raw = localStorage.getItem(key)
    if (!raw) {
      return
    }
    const parsed = JSON.parse(raw)
    hiddenResolvedIssueIds.value = Array.isArray(parsed) ? parsed : []
  } catch (error) {
  }
}

const persistDispatcherIssueState = () => {
  if (props.session.role !== 'dispatcher') {
    return
  }
  try {
    const key = dispatcherIssueStorageKey.value
    if (!key) {
      return
    }
    localStorage.setItem(key, JSON.stringify(hiddenResolvedIssueIds.value))
  } catch (error) {
  }
}

const payByMetaMask = async (ethAmount) => {
  if (!window.ethereum) {
    throw new Error('未检测到 MetaMask，请先安装插件')
  }
  if (!renterWallet.value) {
    throw new Error('请先在租车页面连接 MetaMask 钱包')
  }

  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: renterWallet.value,
        to: payeeAddress,
        value: decimalEthToWeiHex(ethAmount)
      }
    ]
  })
  return txHash
}

// 管理员通过 MetaMask 退还押金给用户
const refundByMetaMask = async (fromAddress, toAddress, ethAmount) => {
  if (!window.ethereum) {
    throw new Error('未检测到 MetaMask，请先安装插件')
  }
  if (!fromAddress) {
    throw new Error('请先在页面顶部连接 MetaMask 钱包')
  }
  if (!toAddress) {
    throw new Error('用户未绑定钱包地址，无法退款')
  }

  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: fromAddress,
        to: toAddress,
        value: decimalEthToWeiHex(ethAmount)
      }
    ]
  })
  return txHash
}

const createOrder = async () => {
  if (!myUserId.value || !rentForm.carId) {
    ElMessage.warning('请确保填写用户ID并选择车辆')
    return
  }
  const selectedCar = carsList.value.find(c => c.id === rentForm.carId)
  if (!selectedCar || selectedCar.status !== 'available') {
    ElMessage.warning('所选车辆当前不可用，请选择其他可用车辆')
    return
  }
  try {
    let txHash = null
    if (props.session.role === 'renter') {
      if (!renterWallet.value) {
        ElMessage.warning('请先连接 MetaMask 钱包')
        return
      }
      // ① 先在后端创建订单，获取订单 UUID
      const orderRes = await api.post('/orders', {
        userId: myUserId.value,
        carId: rentForm.carId,
        hours: rentForm.hours,
        txHash: null
      })
      currentOrderId.value = orderRes.id

      // ② 押金存入托管合约（资金锁在合约中，不直接打给平台）
      const escrowContractAddress = import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS
      if (escrowContractAddress) {
        const escrowResult = await depositToEscrow(orderRes.id, depositEth)
        txHash = escrowResult.txHash
        ElMessage.success(`押金已存入托管合约，交易哈希：${txHash.slice(0, 12)}...`)

        // ③ 将链上交易哈希回传后端记录
        await api.post(`/orders/${orderRes.id}/escrow-tx`, { txHash })
      } else {
        // 未配置合约时降级为直接转账（兼容旧逻辑）
        const payAmount = depositEth
        txHash = await payByMetaMask(payAmount)
        ElMessage.success(`押金支付成功，交易哈希：${txHash.slice(0, 12)}...`)
        await api.post(`/orders/${orderRes.id}/escrow-tx`, { txHash })
      }
      ElMessage.success('订单创建成功')
    } else {
      // 非租客角色直接建单（管理员/调度员等）
      const res = await api.post('/orders', {
        userId: myUserId.value,
        carId: rentForm.carId,
        hours: rentForm.hours,
        txHash: null
      })
      currentOrderId.value = res.id
      ElMessage.success('订单创建成功')
    }
    persistRenterState()
    loadState()
    loadMyOrders()
  } catch (error) {
    if (error?.message?.includes('User rejected') || error?.code === 4001) {
      ElMessage.error('用户拒绝了交易，订单已取消')
      currentOrderId.value = ''
    } else {
      ElMessage.error(error?.message || '订单创建失败')
    }
  }
}

const clearOrderIfNotFound = (error) => {
  const msg = error?.message || ''
  if (msg.includes('订单不存在')) {
    currentOrderId.value = ''
    ElMessage.warning('该订单在服务器中不存在，已清空本地订单号，请重新创建订单')
  }
}

const pickupCar = async () => {
  try {
    // ① 后端记录取车
    await api.post(`/orders/${currentOrderId.value}/pickup`, {
      pickupPhotoHash: 'hash_front_door',
      pickupIot: 'gps_ok,door_unlocked'
    })

    // ② 若配置了托管合约，链上状态变更延后到完成订单时处理
    const escrowAddr = import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS
    if (escrowAddr) {
      ElMessage.success('取车成功，链上状态将在完成订单时一并更新')
    } else {
      ElMessage.success('取车成功，数据已上链')
    }
    loadState()
  } catch (error) {
    clearOrderIfNotFound(error)
  }
}

const reportIssue = () => {
  if (!currentOrderId.value) {
    ElMessage.warning('当前没有进行中的订单')
    return
  }
  reportIssueForm.issueType = ''
  reportIssueForm.detail = ''
  reportIssueVisible.value = true
}

const submitReportIssue = async () => {
  if (!reportIssueForm.issueType) {
    ElMessage.warning('请选择故障类型')
    return
  }
  if (!reportIssueForm.detail || reportIssueForm.detail.trim().length < 5) {
    ElMessage.warning('请详细描述故障情况，至少5个字')
    return
  }
  try {
    await api.post(`/orders/${currentOrderId.value}/report-issue`, {
      issueType: reportIssueForm.issueType,
      detail: reportIssueForm.detail.trim(),
      requestRefund: reportIssueForm.requestRefund
    })
    ElMessage.success(reportIssueForm.requestRefund ? '故障已上报，已提交退押金申请' : '故障已上报，调度员会尽快处理')
    reportIssueVisible.value = false
  } catch (error) {
    clearOrderIfNotFound(error)
    if (!error?.message?.includes('订单不存在')) {
      ElMessage.error('故障上报失败，请稍后重试')
    }
  }
}

const returnCar = async () => {
  try {
    const res = await api.post(`/orders/${currentOrderId.value}/return`, {
      returnPhotoHash: 'hash_returned',
      returnIot: 'gps_ok,door_locked'
    })
    ElMessage.success(`还车成功！使用费 ${res.usageFee} 元，请完成付款`)

    const usageFeeEth = res.usageFee / (Number(import.meta.env.VITE_ETH_CNY_RATE) || 2500)
    const confirmed = await ElMessageBox.confirm(
      `应付使用费：${res.usageFee} 元（约 ${usageFeeEth.toFixed(4)} ETH）\n\n是否现在用 MetaMask 支付？`,
      '请完成付款',
      { confirmButtonText: '立即支付', cancelButtonText: '稍后支付', type: 'warning' }
    ).catch(() => false)

    if (confirmed) {
      const txHash = await payByMetaMask(usageFeeEth)
      await api.post(`/orders/${currentOrderId.value}/pay-usage-fee`, { txHash })
      ElMessage.success(`使用费支付成功，交易哈希：${txHash.slice(0, 12)}...`)
    } else {
      ElMessage.warning('请稍后在订单详情中完成使用费支付')
    }

    currentOrderId.value = ''
    loadState()
    loadMyOrders()
  } catch (error) {
    clearOrderIfNotFound(error)
  }
}

const loadMyOrders = async () => {
  if (!myUserId.value) {
    ElMessage.warning('请先填写或获取用户ID')
    return
  }
  const applyReturnedSuccessfully = (orders) =>
    orders.map((order) => ({
      ...order,
      returnedSuccessfully:
        order.status === 'completed' &&
        (Boolean(order.returnPhotoHash) && Boolean(order.returnIot) ||
          (Boolean(order.pickupPhotoHash) && order.status === 'completed'))
    }))

  try {
    const raw = await api.get(`/orders/history/${myUserId.value}`, { suppressError: true })
    myOrders.value = applyReturnedSuccessfully(raw || [])
  } catch (error) {
    // 首次失败后重试一次，避免偶发网络抖动误判
    try {
      const raw = await api.get(`/orders/history/${myUserId.value}`, { suppressError: true })
      myOrders.value = applyReturnedSuccessfully(raw || [])
    } catch {
      // 重试仍然失败，使用 /state 回退查询
      try {
        const state = await api.get('/state')
        myOrders.value = applyReturnedSuccessfully(
          (state.orders || [])
            .filter((item) => item.userId === myUserId.value)
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        )
        ElMessage.warning('历史接口不可用，已使用本地状态回退查询')
      } catch (fallbackError) {
        ElMessage.error('订单历史查询失败，请刷新页面后重试')
      }
    }
  }
}

const approveUser = async (userId) => {
  if (!userId) return
  try {
    await api.post(`/admin/approve/${userId}`)
    ElMessage.success(`用户审批通过！`)
    loadState()
  } catch (error) {}
}

const submitMaintenance = async () => {
  if (!maintForm.carId) return ElMessage.warning('请选择车辆')
  try {
    await api.post('/dispatcher/maintenance', {
      carId: maintForm.carId,
      dispatcher: props.session.username,
      action: maintForm.action,
      targetStatus: maintForm.targetStatus,
      note: maintForm.note
    })
    ElMessage.success('维护记录已提交')
    loadState()
  } catch (error) {}
}

const resolveDispatcherIssue = async (orderId, targetStatus) => {
  if (!orderId) return
  const issue = dispatcherIssues.value.find((item) => item.id === orderId)
  if (!issue?.carId) {
    ElMessage.error('故障处理失败，请稍后重试')
    return
  }
  try {
    await api.post(`/dispatcher/issues/${orderId}/resolve`, {
      dispatcher: props.session.username,
      targetStatus,
      note: targetStatus === 'maintenance' ? '故障转维护处理' : '故障处理完成'
    })
    if (!hiddenResolvedIssueIds.value.includes(orderId)) {
      hiddenResolvedIssueIds.value = [...hiddenResolvedIssueIds.value, orderId]
    }
    issue.issueStatus = 'resolved'
    issue.issueReported = false
    ElMessage.success('故障工单已处理')
    loadState()
  } catch (error) {}
}

// 退押金相关函数
const loadDepositRefundRequests = async () => {
  try {
    loadingDepositRefund.value = true
    depositRefundRequests.value = await api.get('/admin/deposit-refund-requests')
  } catch (error) {
    try {
      const state = await api.get('/state')
      depositRefundRequests.value = (state.orders || []).filter(
        (item) => item.depositRefundRequested && item.depositRefundStatus !== 'completed' && item.depositRefundStatus !== 'rejected'
      )
    } catch (e) {
      ElMessage.error('加载退押金申请列表失败')
    }
  } finally {
    loadingDepositRefund.value = false
  }
}

const depositRefundStatusLabel = (status) => {
  const map = {
    'pending_admin': '待审核',
    'completed': '已退款',
    'rejected': '已拒绝'
  }
  return map[status] || status || '待审核'
}

const depositRefundStatusTagType = (status) => {
  if (status === 'completed') return 'success'
  if (status === 'rejected') return 'danger'
  if (status === 'pending_admin') return 'warning'
  return 'info'
}

const openDepositRefundDialog = (order) => {
  depositRefundOrder.value = order
  depositRefundForm.approved = true
  depositRefundForm.note = ''
  depositRefundVisible.value = true
}

const submitDepositRefund = async () => {
  if (!depositRefundOrder.value) return
  try {
    depositRefundSubmitting.value = true

    let txHash = null

    // 如果批准退款，需要先通过 MetaMask 发起链上转账
    if (depositRefundForm.approved) {
      const order = depositRefundOrder.value
      const depositEth = order.deposit / 2500  // 换算 ETH
      const userWallet = order.userWallet || order.user?.walletAddress || null

      if (!userWallet) {
        ElMessage.error('该用户未绑定钱包地址，无法退还押金')
        depositRefundSubmitting.value = false
        return
      }

      // 检查管理员是否已连接 MetaMask
      if (!renterWallet.value) {
        ElMessage.error('请先在页面顶部连接 MetaMask 钱包（管理员身份）')
        depositRefundSubmitting.value = false
        return
      }

      // 弹出 MetaMask 确认转账
      try {
        txHash = await refundByMetaMask(renterWallet.value, userWallet, depositEth)
        ElMessage.info('MetaMask 交易已提交，等待链上确认...')
      } catch (err) {
        if (err.code === 4001 || /user rejected|rejected by the user/i.test(err.message)) {
          ElMessage.warning('您取消了 MetaMask 签名，审核未完成')
        } else {
          ElMessage.error(err.message || 'MetaMask 转账失败')
        }
        depositRefundSubmitting.value = false
        return
      }
    }

    // 调用后端审核接口
    const result = await api.post(`/admin/deposit-refund/${depositRefundOrder.value.id}`, {
      adminId: props.session.username,
      approved: depositRefundForm.approved,
      note: depositRefundForm.note,
      txHash  // 把链上交易哈希传给后端
    })

    if (depositRefundForm.approved) {
      if (result?.depositEthAmount) {
        ElMessage.success({
          message: `退押金审核完成！${result.depositEthAmount.toFixed(5)} ETH 已退还到用户钱包（tx: ${(txHash || '').slice(0, 10)}...）`,
          duration: 5000
        })
      } else {
        ElMessage.success('退押金审核完成')
      }
    } else {
      ElMessage.success('已拒绝退押金申请')
    }
    depositRefundVisible.value = false
    loadDepositRefundRequests()
    loadState()
    if (myUserId.value) loadMyOrders()
  } catch (error) {
    ElMessage.error(error.message || '退押金审核失败')
  } finally {
    depositRefundSubmitting.value = false
  }
}

// 租客端退押金申请相关函数
const openDepositRefundApplyDialog = (order) => {
  depositRefundApplyOrder.value = order
  depositRefundApplyForm.reason = '正常退押金'
  depositRefundApplyForm.note = ''
  depositRefundApplyVisible.value = true
}

const submitDepositRefundApply = async () => {
  if (!depositRefundApplyOrder.value) return
  if (!depositRefundApplyForm.reason) {
    ElMessage.warning('请选择退押金原因')
    return
  }
  try {
    depositRefundApplySubmitting.value = true
    const reason = depositRefundApplyForm.note
      ? `${depositRefundApplyForm.reason}：${depositRefundApplyForm.note}`
      : depositRefundApplyForm.reason

    await api.post(
      `/orders/${depositRefundApplyOrder.value.id}/apply-deposit-refund`,
      { reason },
      { suppressError: true }
    )
    ElMessage.success('退押金申请已提交，请等待管理员审核')
    depositRefundApplyVisible.value = false
    loadMyOrders()
  } catch (error) {
    const status = error?.status
    const msg = error.message || '退押金申请提交失败'
    if (status === 404 || /404|Not Found/i.test(msg)) {
      ElMessage.error(
        '接口 404：请先在项目根目录启动后端（npm start 或 npm run dev），并确保与前端同时运行；也可一键执行 npm run dev:all'
      )
    } else if (/Network Error|ECONNREFUSED|连接/i.test(msg)) {
      ElMessage.error('无法连接后端：请确认 Express 已在端口 3000 运行（与 vite 代理一致）')
    } else {
      ElMessage.error(msg)
    }
  } finally {
    depositRefundApplySubmitting.value = false
  }
}

const getCarStatusLabel = (status) => {
  const map = { available: '可用', reserved: '已预订', in_use: '使用中', maintenance: '维护中' }
  return map[status] || status
}

// Wikimedia Commons 实拍图（800px，CC 许可）；国内直连常失败，故配合代理与本地 /cars/photos/CAR-xxx.jpg
const CAR_IMAGES_REMOTE = {
  'BYD Dolphin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/2023_BYD_Dolphin_Design_1.jpg/800px-2023_BYD_Dolphin_Design_1.jpg',
  'Tesla Model 3': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/2018_Tesla_Model_3_Long_Range_RWD_Front_View.jpg/800px-2018_Tesla_Model_3_Long_Range_RWD_Front_View.jpg',
  'AION Y': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/2022_GAC_Aion_Y_Plus.jpg/800px-2022_GAC_Aion_Y_Plus.jpg',
  'NIO ET5': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/NIO_ET5_001.jpg/800px-NIO_ET5_001.jpg',
  'Xpeng P7': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Xpeng_P7_007.jpg/800px-Xpeng_P7_007.jpg',
  'Li Auto L8': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/2023_Lixiang_L8_%28front%29.jpg/800px-2023_Lixiang_L8_%28front%29.jpg',
  'Maybach S-Class': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Mercedes-Maybach_S-Class_W223.jpg/800px-Mercedes-Maybach_S-Class_W223.jpg',
  'Xiaomi SU7': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Xiaomi_SU7_Max_2024.jpg/800px-Xiaomi_SU7_Max_2024.jpg',
}

// 项目内已有矢量示意（非实拍，仅作回退）
const CAR_IMAGES_LOCAL_SVG = {
  'BYD Dolphin': '/cars/byd-dolphin.svg',
  'Tesla Model 3': '/cars/tesla-model3.svg',
  'AION Y': '/cars/aion-y.svg',
  'NIO ET5': '/cars/nio-et5.svg',
  'Xpeng P7': '/cars/xpeng-p7.svg',
  'Li Auto L8': '/cars/li-auto-l8.svg',
}

const DEFAULT_CAR_IMAGE = new URL('../assets/cars/default-car.svg', import.meta.url).href

/** 通过 images.weserv.nl 拉取外链图，部分网络环境下比直连 Wikimedia 更可用 */
const proxiedImageUrl = (absoluteUrl) => {
  if (!absoluteUrl || !absoluteUrl.startsWith('http')) {
    return ''
  }
  const u = absoluteUrl.replace(/^https:\/\//, '')
  return `https://images.weserv.nl/?url=${encodeURIComponent(u)}&w=800&output=jpg&q=85`
}

const getCarImageCandidates = (car) => {
  if (!car?.id) {
    return [DEFAULT_CAR_IMAGE]
  }
  const list = []
  if (car.photo) {
    list.push(`/cars/photos/${car.photo}`)
  }
  list.push(`/cars/photos/${car.id}.jpg`)
  const svg = CAR_IMAGES_LOCAL_SVG[car.model]
  if (svg) {
    list.push(svg)
  }
  const remote = CAR_IMAGES_REMOTE[car.model]
  if (remote) {
    const proxied = proxiedImageUrl(remote)
    if (proxied) {
      list.push(proxied)
    }
    list.push(remote)
  }
  list.push(DEFAULT_CAR_IMAGE)
  return list
}

const getCarImage = (car) => {
  return getCarImageCandidates(car)[0]
}

const handleImageError = (event, car) => {
  const img = event.target
  const cands = getCarImageCandidates(car)
  let idx = Number(img.dataset.imgTry ?? 0)
  idx += 1
  img.dataset.imgTry = String(idx)
  if (idx < cands.length) {
    const next = cands[idx]
    img.referrerPolicy = next.startsWith('http') ? 'no-referrer' : ''
    img.src = next
    return
  }
  img.src = DEFAULT_CAR_IMAGE
}

// Admin: load all cars for management panel
const loadAllCars = async () => {
  try {
    loadingCars.value = true
    allCars.value = await api.get('/cars')
  } catch (error) {
    ElMessage.error('加载车辆列表失败')
  } finally {
    loadingCars.value = false
  }
}

// Admin: add new car
const handlePhotoSelect = (file) => {
  pendingPhotoFile.value = file
  return false
}

const addCar = async () => {
  if (!newCarForm.model || !newCarForm.plate) {
    ElMessage.warning('请填写车型和牌照')
    return
  }
  try {
    const payload = {
      model: newCarForm.model,
      brand: newCarForm.brand,
      type: newCarForm.type,
      plate: newCarForm.plate,
      battery: Number(newCarForm.battery) || 100,
      seats: Number(newCarForm.seats) || 5,
      pricePerHour: Number(newCarForm.pricePerHour) || 35,
      location: newCarForm.location,
      status: newCarForm.status,
    }
    if (newCarForm.id && newCarForm.id.trim()) {
      payload.id = newCarForm.id.trim()
    }
    const added = await api.post('/admin/cars', payload)
    if (pendingPhotoFile.value) {
      try {
        const res = await uploadCarPhoto(added.id, pendingPhotoFile.value)
        added.photo = res.photo
        await api.put(`/admin/cars/${added.id}`, { photo: res.photo })
        const idx = allCars.value.findIndex(c => c.id === added.id)
        if (idx !== -1) allCars.value[idx] = { ...added }
      } catch (e) {
        ElMessage.warning('车辆已添加，但图片上传失败：' + e.message)
      }
      pendingPhotoFile.value = null
    }
    allCars.value.unshift(added)
    ElMessage.success(`车辆 ${added.id} 录入成功`)
    Object.assign(newCarForm, { id: '', model: '', brand: '', type: '', plate: '', battery: 100, seats: 5, pricePerHour: 35, location: '', status: 'available' })
  } catch (error) {
    // error.message 已由 api 拦截器弹出，此处无需再弹
  }
}

// Admin: open edit dialog
const openEditCar = (car) => {
  Object.assign(editCarForm, { ...car })
  editCarVisible.value = true
}

// Admin: save edited car
const saveEditCar = async () => {
  try {
    const updated = await api.put(`/admin/cars/${editCarForm.id}`, {
      model: editCarForm.model,
      brand: editCarForm.brand,
      type: editCarForm.type,
      plate: editCarForm.plate,
      battery: Number(editCarForm.battery),
      seats: Number(editCarForm.seats),
      pricePerHour: Number(editCarForm.pricePerHour),
      location: editCarForm.location,
      status: editCarForm.status,
    })
    const idx = allCars.value.findIndex((c) => c.id === updated.id)
    if (idx !== -1) allCars.value[idx] = updated
    editCarVisible.value = false
    ElMessage.success('车辆信息已更新')
  } catch (error) {
    // error.message 已由拦截器弹出
  }
}

// Admin: delete car
const removeCar = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该车辆？删除后将无法恢复。', '删除确认', { type: 'warning' })
    await api.delete(`/admin/cars/${id}`)
    allCars.value = allCars.value.filter((c) => c.id !== id)
    ElMessage.success('车辆已删除')
  } catch (error) {
    // ElMessageBox 取消时抛出的 'cancel' 是字符串，不是 Error
    if (typeof error === 'string' && error !== 'cancel') {
      ElMessage.error(error)
    }
  }
}

// 车辆座位与价格默认值（接口未返回时前端兜底显示）
const CAR_SEATS_PRICE = {
  'CAR-001': { seats: 5, pricePerHour: 35 },
  'CAR-002': { seats: 5, pricePerHour: 55 },
  'CAR-003': { seats: 5, pricePerHour: 40 },
  'CAR-004': { seats: 5, pricePerHour: 65 },
  'CAR-005': { seats: 5, pricePerHour: 50 },
  'CAR-006': { seats: 6, pricePerHour: 80 },
  'CAR-007': { seats: 4, pricePerHour: 200 },
  'CAR-008': { seats: 5, pricePerHour: 60 },
}
const displayCarSeats = (car) => {
  if (car == null) return '—'
  if (car.seats != null && car.seats !== '') return car.seats
  return CAR_SEATS_PRICE[car.id]?.seats ?? '—'
}
const displayCarPrice = (car) => {
  if (car == null) return '—'
  if (car.pricePerHour != null && car.pricePerHour !== '') return car.pricePerHour
  return CAR_SEATS_PRICE[car.id]?.pricePerHour ?? '—'
}

const getCarStatusType = (status) => {
  const map = { available: 'success', reserved: 'warning', in_use: 'primary', maintenance: 'danger' }
  return map[status] || 'info'
}

const orderStatusLabel = (status) => {
  const map = { reserved: '已预订', in_use: '使用中', completed: '已完成', cancelled: '已取消' }
  return map[status] || status
}

const orderStatusType = (status) => {
  const map = { reserved: 'warning', in_use: 'primary', completed: 'success', cancelled: 'info' }
  return map[status] || 'info'
}

onMounted(async () => {
  restoreRenterState()
  restoreDispatcherIssueState()
  if (props.session.role === 'renter') {
    await syncRenterUser()  // 从服务端同步用户ID，避免本地状态与后端不一致
  }
  loadState()
  if (props.session.role === 'renter' && myUserId.value) {
    loadMyOrders()
  }
})

watch(
  [myUserId, currentOrderId, () => rentForm.carId, () => rentForm.hours, renterWallet],
  () => {
    persistRenterState()
  }
)

watch(
  hiddenResolvedIssueIds,
  () => {
    persistDispatcherIssueState()
  },
  { deep: true }
)
</script>

<style scoped>
.rent-hours-inline {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
}
.rent-hours-inline :deep(.el-input-number) {
  width: 160px;
  flex-shrink: 0;
}
.rent-hours-unit {
  color: #606266;
  font-size: 14px;
  line-height: 32px;
  white-space: nowrap;
}

.dashboard-layout {
  height: 100vh;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #1e3a8a;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.username {
  font-size: 14px;
  color: #475569;
}

.main-container {
  height: calc(100vh - 60px);
}

.side-menu {
  background-color: #fff;
  border-right: 1px solid #e2e8f0;
}

.el-menu-vertical {
  border-right: none;
}

.content-area {
  padding: 24px;
  background-color: #f8fafc;
}

.stat-cards {
  margin-bottom: 24px;
}

.stat-title {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
}

.stat-hash {
  font-family: 'Courier New', Consolas, monospace;
  font-size: 13px;
  color: #67c23a;
  word-break: break-all;
  line-height: 1.4;
}

.mt-4 {
  margin-top: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.p-4 {
  padding: 16px;
}

.bg-blue-50 {
  background-color: #eff6ff;
}

.rounded {
  border-radius: 8px;
}

.action-card {
  max-width: 1400px;
}

.chain-code {
  background-color: #1e293b;
  color: #a5b4fc;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 13px;
  max-height: 500px;
}

.hash-text {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #67c23a;
  word-break: break-all;
}

.order-action-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
}

.order-action-row .el-button {
  margin-left: 0;
}

/* 车辆卡片样式 */
.car-grid {
  min-height: 200px;
}

.car-grid .el-row {
  display: flex;
  flex-wrap: wrap;
}

.car-grid .el-col {
  margin-bottom: 20px;
}

.car-card {
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
  height: 100%;
}

.car-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.photo-uploader {
  width: 150px;
  height: 150px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.3s;
}

.photo-uploader:hover {
  border-color: #409eff;
}

.photo-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.photo-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.photo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.review-photos {
  display: flex;
  gap: 6px;
}

.photo-thumb {
  width: 40px;
  height: 40px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.photo-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-thumb .no-photo {
  font-size: 11px;
  color: #909399;
}

.photo-popover {
  text-align: center;
}

.popover-title {
  font-weight: bold;
  margin-bottom: 10px;
  color: #303133;
}

.popover-img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
}

.popover-no-photo {
  color: #909399;
  padding: 20px;
}

.car-image-wrapper {
  position: relative;
  height: 180px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.car-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.car-status-tag {
  position: absolute;
  top: 12px;
  right: 12px;
}

.car-info {
  padding: 16px;
}

.car-model {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.car-brand-type {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 8px;
}

.car-plate {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 12px;
  font-family: 'Courier New', monospace;
}

.car-detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.car-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.car-seats {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #475569;
  white-space: nowrap;
  flex-shrink: 0;
}

.car-price {
  text-align: right;
  white-space: nowrap;
  flex-shrink: 0;
}

.price-value {
  font-size: 16px;
  font-weight: 700;
  color: #f59e0b;
}

.price-unit {
  font-size: 12px;
  color: #64748b;
}

.car-location {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #475569;
}

.car-battery {
  width: 100%;
}

.car-battery .el-progress {
  width: 100%;
}

/* 确保数字输入框有足够空间显示数字 */
.el-input-number {
  width: 100%;
}

.el-input-number .el-input__inner {
  text-align: left;
  padding-right: 50px;
  min-width: 60px;
}

.el-input-number.is-controls-right .el-input__inner {
  padding-right: 50px;
  padding-left: 8px;
}
</style>
