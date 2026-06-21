<template>
  <div style="padding: 30px 15px; min-height: 100vh; width: 100%;">
    <div style="width: 100%; max-width: 1200px; margin: 0 auto;">
      <!-- Sleek Top Header / Navbar -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 16px 24px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02); flex-wrap: wrap; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #2563eb, #3b82f6); display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; font-weight: 700; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);">
            H
          </div>
          <div>
            <h1 class="title-gradient" style="margin: 0; line-height: 1.2;">Huawei Connect</h1>
            <div class="subtitle">Professional SMS Broadcasting Portal</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
          <div v-if="credentials.password" style="font-size: 13px; color: #10b981; display: flex; align-items: center; gap: 6px; font-weight: 600; background: #ecfdf5; padding: 6px 12px; border-radius: 8px; border: 1px solid #d1fae5;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;"></span>
            Connected ({{ credentials.routerIp }})
          </div>
          <div v-else style="font-size: 13px; color: #f59e0b; display: flex; align-items: center; gap: 6px; font-weight: 600; background: #fffbeb; padding: 6px 12px; border-radius: 8px; border: 1px solid #fef3c7;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #f59e0b; box-shadow: 0 0 8px #f59e0b;"></span>
            Config Required
          </div>
          <a-button type="default" @click="isSettingsModalVisible = true" style="border-radius: 8px; display: flex; align-items: center; gap: 6px; font-weight: 500;">
            <SettingOutlined /> Configure
          </a-button>
        </div>
      </div>

      <!-- Metrics Row -->
      <a-row :gutter="[16, 16]" class="metrics-row">
        <a-col :xs="24" :sm="12" :md="6">
          <div class="metric-card router-card">
            <div class="metric-icon-wrapper">
              <ApiOutlined />
            </div>
            <div class="metric-info">
              <div class="metric-title">Router Status</div>
              <div class="metric-value" style="font-size: 14px; text-transform: uppercase;">{{ credentials.password ? 'CONNECTED' : 'OFFLINE' }}</div>
              <div class="metric-subtitle">{{ credentials.routerIp }}</div>
            </div>
          </div>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6">
          <div class="metric-card contacts-card">
            <div class="metric-icon-wrapper">
              <ContactsOutlined />
            </div>
            <div class="metric-info">
              <div class="metric-title">Phone Book</div>
              <div class="metric-value">{{ phonebook.length }}</div>
              <div class="metric-subtitle">Saved Contacts</div>
            </div>
          </div>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6">
          <div class="metric-card queue-card">
            <div class="metric-icon-wrapper">
              <RocketOutlined />
            </div>
            <div class="metric-info">
              <div class="metric-title">Broadcast Queue</div>
              <div class="metric-value">{{ contacts.length }}</div>
              <div class="metric-subtitle">Pending / Loaded</div>
            </div>
          </div>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6">
          <div class="metric-card inbox-card">
            <div class="metric-icon-wrapper">
              <InboxOutlined />
            </div>
            <div class="metric-info">
              <div class="metric-title">Inbox</div>
              <div class="metric-value">{{ inboxMessages.length }}</div>
              <div class="metric-subtitle">Received Messages</div>
            </div>
          </div>
        </a-col>
      </a-row>

      <a-card class="glass-card">
        <a-tabs v-model:activeKey="activeTab" centered style="margin-top: 0px;">
        <!-- Single SMS Mode -->
        <a-tab-pane key="single">
          <template #tab>
            <span><MessageOutlined /> Quick Send</span>
          </template>
          
          <a-form layout="vertical" style="margin-top: 20px;">
            <a-form-item label="Recipient Phone Number" required>
              <a-input v-model:value="singleForm.phone" placeholder="e.g. 0729423232" size="large">
                <template #prefix><PhoneOutlined style="color: rgba(0,0,0,.25)" /></template>
              </a-input>
            </a-form-item>

            <a-form-item label="Message Content" required>
              <a-textarea v-model:value="singleForm.content" placeholder="Type your message here..." :rows="5" />
              <div v-if="singleForm.content" class="sms-counter">
                <span class="sms-counter-item">
                  <span class="sms-counter-label">Characters:</span>
                  <span class="sms-counter-value">{{ getSmsInfo(singleForm.content).length }} / {{ getSmsInfo(singleForm.content).limit }}</span>
                </span>
                <span class="sms-counter-item">
                  <span class="sms-counter-label">SMS Parts:</span>
                  <span class="sms-counter-value">{{ getSmsInfo(singleForm.content).parts }}</span>
                </span>
                <span class="sms-counter-item">
                  <span class="sms-counter-label">Encoding:</span>
                  <span class="sms-counter-value encoding-tag" :class="getSmsInfo(singleForm.content).encoding.toLowerCase()">{{ getSmsInfo(singleForm.content).encoding }}</span>
                </span>
              </div>
            </a-form-item>

            <a-form-item style="margin-bottom: 0; margin-top: 30px;">
              <a-button type="primary" @click="onSendSingle" block :loading="loading" class="premium-btn">
                Send Message
              </a-button>
            </a-form-item>
          </a-form>
        </a-tab-pane>

        <!-- Bulk SMS Mode -->
        <a-tab-pane key="bulk">
          <template #tab>
            <span><TeamOutlined /> Bulk Broadcast</span>
          </template>

          <div style="margin-top: 20px; margin-bottom: 24px;">
            <a-row :gutter="20">
              <!-- Upload Contacts File -->
              <a-col :xs="24" :sm="14" style="margin-bottom: 12px;">
                <a-upload-dragger
                  name="file"
                  :multiple="false"
                  :before-upload="handleFileUpload"
                  accept=".csv,.vcf,.txt"
                  :showUploadList="false"
                  style="height: 100%; display: flex; flex-direction: column; justify-content: center;"
                >
                  <p class="ant-upload-drag-icon" style="margin-bottom: 8px;">
                    <CloudUploadOutlined style="color: #11998e;" />
                  </p>
                  <p class="ant-upload-text" style="font-weight: 600; font-size: 15px;">Upload contacts file</p>
                  <p class="ant-upload-hint" style="color: #64748b; font-size: 12px; margin-top: 4px;">
                    Supports CSV, VCF, and TXT
                  </p>
                </a-upload-dragger>
              </a-col>

              <!-- Import from Phone Book -->
              <a-col :xs="24" :sm="10" style="margin-bottom: 12px;">
                <div style="border: 2px dashed #cbd5e1; border-radius: 16px; padding: 20px; background-color: #f8fafc; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; min-height: 160px;">
                  <span style="font-weight: 600; font-size: 15px; color: #475569; display: block; margin-bottom: 10px;">
                    <ContactsOutlined style="color: #11998e; margin-right: 4px;" /> Or Import Group
                  </span>
                  <a-select 
                    v-model:value="selectedImportGroups"
                    mode="multiple"
                    placeholder="Select Phone Book Groups" 
                    style="width: 100%; text-align: left;" 
                    @change="importGroupsToBroadcast"
                    :allowClear="true"
                  >
                    <a-select-option value="All">All Contacts ({{ phonebook.length }})</a-select-option>
                    <a-select-option v-for="grp in groups" :key="grp" :value="grp">
                      {{ grp }} ({{ getGroupContactCount(grp) }})
                    </a-select-option>
                  </a-select>
                </div>
              </a-col>
            </a-row>
          </div>

          <div v-if="contacts.length > 0" style="margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-weight: 600; font-size: 15px; color: #334155;">Contact List Preview</span>
              <div style="display: flex; align-items: center; gap: 12px;">
                <a-button 
                  v-if="contacts.some(c => !isMobileNumber(c.phone))"
                  type="default" 
                  danger 
                  size="small" 
                  style="border-radius: 6px;" 
                  @click="removeNonMobileFromPreview"
                >
                  <DeleteOutlined /> Remove Non-Mobile
                </a-button>
                <span style="font-size: 13px; color: #64748b;">Selected: <strong style="color: #11998e;">{{ selectedRowKeys.length }}</strong> / {{ contacts.length }}</span>
                <a-badge :count="contacts.length" :number-style="{ backgroundColor: '#11998e' }" />
              </div>
            </div>
            
            <!-- Scrolled Table -->
            <a-table 
              :dataSource="contacts" 
              :columns="columns" 
              size="small" 
              :pagination="false"
              :scroll="{ x: 'max-content', y: 250 }"
              :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
              bordered
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'phone'">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span>{{ record.phone }}</span>
                    <a-tag v-if="!isMobileNumber(record.phone)" color="red" style="border-radius: 4px; font-size: 11px; padding: 0 4px;">Non-Mobile</a-tag>
                  </div>
                </template>
                <template v-if="column.key === 'status'">
                  <a-tag :color="getStatusColor(record.status)" style="border-radius: 6px; font-weight: 500;">
                    <template #icon v-if="record.status === 'sending...'">
                      <LoadingOutlined />
                    </template>
                    {{ record.status.toUpperCase() }}
                  </a-tag>
                </template>
              </template>
            </a-table>
          </div>

          <a-form layout="vertical">
            <a-form-item required>
              <template #label>
                Message Template <span style="font-weight: normal; color: #64748b; margin-left: 5px;">(Use <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">{name}</code> for personalization)</span>
              </template>
              <a-textarea v-model:value="bulkForm.content" placeholder="Hello {name}, your special offer is inside..." :rows="5" />
              <div v-if="bulkForm.content" class="sms-counter">
                <span class="sms-counter-item">
                  <span class="sms-counter-label">Characters:</span>
                  <span class="sms-counter-value">{{ getSmsInfo(bulkForm.content).length }} / {{ getSmsInfo(bulkForm.content).limit }}</span>
                </span>
                <span class="sms-counter-item">
                  <span class="sms-counter-label">SMS Parts:</span>
                  <span class="sms-counter-value">{{ getSmsInfo(bulkForm.content).parts }}</span>
                </span>
                <span class="sms-counter-item">
                  <span class="sms-counter-label">Encoding:</span>
                  <span class="sms-counter-value encoding-tag" :class="getSmsInfo(bulkForm.content).encoding.toLowerCase()">{{ getSmsInfo(bulkForm.content).encoding }}</span>
                </span>
              </div>
            </a-form-item>

            <div v-if="bulkProgress.total > 0" style="margin-bottom: 24px; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: 600; color: #475569;">
                <span>Broadcast Progress</span>
                <span>{{ Math.round((bulkProgress.current / bulkProgress.total) * 100) }}%</span>
              </div>
              <a-progress :percent="Math.round((bulkProgress.current / bulkProgress.total) * 100)" :show-info="false" strokeColor="#38ef7d" trailColor="#e2e8f0" :strokeWidth="10" />
              <div style="display: flex; justify-content: space-between; margin-top: 12px; font-size: 13px; font-weight: 500;">
                <span style="color: #64748b;">Sending {{ bulkProgress.current }} of {{ bulkProgress.total }}</span>
                <div>
                  <span style="color: #10b981; margin-right: 12px;"><CheckCircleOutlined /> {{ bulkProgress.success }}</span>
                  <span style="color: #ef4444;"><CloseCircleOutlined /> {{ bulkProgress.failed }}</span>
                </div>
              </div>
            </div>

            <a-form-item style="margin-bottom: 0;">
              <a-button @click="startBulkSend" block :loading="loading" :disabled="selectedRowKeys.length === 0 || !bulkForm.content" class="premium-btn">
                <RocketOutlined v-if="!loading" style="margin-right: 8px;" />
                {{ loading ? 'Broadcasting...' : 'Start Broadcast' }}
              </a-button>
            </a-form-item>
          </a-form>
        </a-tab-pane>

        <!-- History Mode -->
        <a-tab-pane key="history">
          <template #tab>
            <span><HistoryOutlined /> History</span>
          </template>

          <div style="margin-top: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <span style="font-weight: 600; font-size: 16px; color: #334155;">Recent Messages</span>
              <a-button type="text" danger @click="clearHistory" :disabled="history.length === 0">
                <DeleteOutlined /> Clear History
              </a-button>
            </div>

            <a-table 
              :dataSource="history" 
              :columns="historyColumns" 
              size="small"
              :pagination="{ pageSize: 5 }"
              :scroll="{ x: 'max-content' }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'type'">
                  <a-tag :color="record.type === 'Bulk' ? 'purple' : 'cyan'">{{ record.type }}</a-tag>
                </template>
                <template v-if="column.key === 'status'">
                  <a-tag :color="record.status.includes('Success') || record.status === 'Completed' ? 'green' : 'red'">
                    {{ record.status }}
                  </a-tag>
                </template>
              </template>
            </a-table>
          </div>
        </a-tab-pane>

        <!-- Inbox Mode -->
        <a-tab-pane key="inbox">
          <template #tab>
            <span><InboxOutlined /> Inbox</span>
          </template>

          <div style="margin-top: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
              <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                <span style="font-weight: 600; font-size: 16px; color: #334155; white-space: nowrap;">Received SMS Messages</span>
                <a-input
                  v-model:value="inboxSearchQuery"
                  placeholder="Search inbox..."
                  allow-clear
                  style="width: 160px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 13px;"
                >
                  <template #prefix><SearchOutlined style="color: #94a3b8; font-size: 12px;" /></template>
                </a-input>
                <span style="font-size: 13px; color: #64748b;" v-if="selectedInboxRowKeys.length > 0">
                  Selected: <strong>{{ selectedInboxRowKeys.length }}</strong>
                </span>
              </div>
              <a-button type="primary" @click="fetchInbox" :loading="inboxLoading" class="premium-btn-small" style="display: flex; align-items: center; gap: 6px;">
                <SyncOutlined v-if="!inboxLoading" /> Refresh Inbox
              </a-button>
            </div>

            <!-- Inbox Bulk Actions Bar -->
            <div v-if="selectedInboxRowKeys.length > 0" style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 10px 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
              <span style="font-size: 14px; font-weight: 500; color: #0369a1;">
                Bulk Actions ({{ selectedInboxRowKeys.length }} selected):
              </span>
              <div style="display: flex; gap: 8px; align-items: center;">
                <!-- Bulk Delete Button -->
                <a-popconfirm
                  title="Delete all selected messages?"
                  ok-text="Yes"
                  cancel-text="No"
                  @confirm="bulkDeleteInboxMessages"
                >
                  <a-button type="primary" danger size="small" style="border-radius: 6px;">
                    <DeleteOutlined /> Delete Selected
                  </a-button>
                </a-popconfirm>
              </div>
            </div>

            <a-table 
              :dataSource="filteredInboxMessages" 
              :columns="inboxColumns" 
              size="middle"
              :row-selection="{ selectedRowKeys: selectedInboxRowKeys, onChange: onInboxSelectChange }"
              :pagination="{ pageSize: 10, showSizeChanger: false }"
              :scroll="{ x: 'max-content' }"
              :loading="inboxLoading"
              row-class-name="inbox-row"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'phone'">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #11998e, #38ef7d); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                      <span style="color: white; font-weight: 700; font-size: 13px;">{{ (record.Phone || '?').slice(-2) }}</span>
                    </div>
                    <div>
                      <div style="font-weight: 600; color: #1e293b; font-size: 13px;">{{ record.Phone }}</div>
                      <div style="font-size: 11px; color: #94a3b8;">Sender</div>
                    </div>
                  </div>
                </template>
                <template v-if="column.key === 'content'">
                  <div style="color: #334155; font-size: 13px; line-height: 1.6; white-space: pre-wrap;">{{ record.Content }}</div>
                </template>
                <template v-if="column.key === 'date'">
                  <div style="display: flex; flex-direction: column; gap: 2px;">
                    <span style="color: #475569; font-size: 12px; font-weight: 500;">{{ record.Date ? record.Date.split(' ')[0] : '' }}</span>
                    <span style="color: #94a3b8; font-size: 11px;">{{ record.Date ? record.Date.split(' ').slice(1).join(' ') : '' }}</span>
                  </div>
                </template>
                <template v-if="column.key === 'actions'">
                  <div style="display: flex; flex-direction: column; gap: 4px; align-items: center;">
                    <a-button
                      type="primary"
                      size="small"
                      style="width: 80px; border-radius: 8px; font-size: 12px; background: linear-gradient(135deg,#11998e,#38ef7d); border: none;"
                      @click="replyToMessage(record)"
                    >
                      <MessageOutlined /> Reply
                    </a-button>
                    <a-popconfirm
                      title="Delete this message?"
                      ok-text="Yes"
                      cancel-text="No"
                      @confirm="handleDeleteInboxMessage(record.key)"
                    >
                      <a-button
                        type="primary"
                        danger
                        size="small"
                        style="width: 80px; border-radius: 8px; font-size: 12px;"
                      >
                        <DeleteOutlined /> Delete
                      </a-button>
                    </a-popconfirm>
                  </div>
                </template>
              </template>
            </a-table>
          </div>
        </a-tab-pane>

        <!-- Phone Book Mode -->
        <a-tab-pane key="phonebook">
          <template #tab>
            <span><ContactsOutlined /> Phone Book</span>
          </template>

          <div style="margin-top: 20px;">
            <a-row :gutter="24">
              <!-- Left Sidebar: Groups -->
              <a-col :xs="24" :sm="8" :md="6" style="margin-bottom: 20px;">
                <div class="sidebar-card">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="font-weight: 600; font-size: 15px; color: #334155;">Groups</span>
                    <a-button type="link" size="small" @click="showAddGroupInput = !showAddGroupInput" style="padding: 0;">
                      <PlusOutlined v-if="!showAddGroupInput" />
                      <span v-else>Cancel</span>
                    </a-button>
                  </div>
                  
                  <div v-if="showAddGroupInput" style="margin-bottom: 12px; display: flex; gap: 8px;">
                    <a-input v-model:value="newGroupName" placeholder="Group name..." size="small" @pressEnter="handleAddGroup" />
                    <a-button type="primary" size="small" @click="handleAddGroup"><PlusOutlined /></a-button>
                  </div>

                  <div class="group-list">
                    <div 
                      class="group-item" 
                      :class="{ active: selectedGroupFilter === 'All' }"
                      @click="selectedGroupFilter = 'All'"
                    >
                      <span class="group-name"><FolderOutlined /> All Contacts</span>
                      <a-badge :count="phonebook.length" :number-style="{ backgroundColor: '#64748b' }" />
                    </div>

                    <div 
                      v-for="grp in groups" 
                      :key="grp"
                      class="group-item" 
                      :class="{ active: selectedGroupFilter === grp }"
                      @click="selectedGroupFilter = grp"
                    >
                      <span class="group-name"><FolderOutlined /> {{ grp }}</span>
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <a-badge :count="getGroupContactCount(grp)" :number-style="{ backgroundColor: '#11998e' }" />
                        <a-popconfirm
                          title="Delete this group? (Contacts won't be deleted)"
                          ok-text="Yes"
                          cancel-text="No"
                          @confirm.stop="handleDeleteGroup(grp)"
                        >
                          <DeleteOutlined class="delete-group-icon" @click.stop />
                        </a-popconfirm>
                      </div>
                    </div>
                  </div>
                </div>
              </a-col>

              <!-- Right Pane: Contacts Table -->
              <a-col :xs="24" :sm="16" :md="18">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
                  <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <span style="font-weight: 600; font-size: 16px; color: #334155; white-space: nowrap;">
                      {{ selectedGroupFilter === 'All' ? 'All Contacts' : selectedGroupFilter }}
                    </span>
                    <a-input
                      v-model:value="phonebookSearchQuery"
                      placeholder="Search contacts..."
                      allow-clear
                      style="width: 160px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 13px;"
                    >
                      <template #prefix><SearchOutlined style="color: #94a3b8; font-size: 12px;" /></template>
                    </a-input>
                    <span style="font-size: 13px; color: #64748b;" v-if="selectedPhonebookRowKeys.length > 0">
                      Selected: <strong>{{ selectedPhonebookRowKeys.length }}</strong>
                    </span>
                  </div>
                  <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <a-button 
                      type="primary" 
                      ghost
                      @click="sendPhonebookToBroadcast"
                      :disabled="selectedPhonebookRowKeys.length === 0"
                    >
                      <RocketOutlined /> Send to Broadcast
                    </a-button>
                    <a-popconfirm
                      title="Are you sure you want to remove all contacts with non-mobile phone numbers from the entire phone book?"
                      ok-text="Yes, Remove"
                      cancel-text="No"
                      @confirm="removeNonMobileContacts"
                    >
                      <a-button type="default" danger>
                        <DeleteOutlined /> Remove Non-Mobile
                      </a-button>
                    </a-popconfirm>
                    <a-button type="default" @click="exportAllContacts" :disabled="phonebook.length === 0">
                      <CloudDownloadOutlined /> Export All
                    </a-button>
                    <a-popconfirm
                      title="Are you sure you want to delete ALL contacts from the entire phone book? This cannot be undone."
                      ok-text="Yes, Delete All"
                      cancel-text="No"
                      ok-type="danger"
                      @confirm="deleteAllContacts"
                    >
                      <a-button type="default" danger :disabled="phonebook.length === 0">
                        <DeleteOutlined /> Delete All
                      </a-button>
                    </a-popconfirm>
                    <a-button type="default" @click="openImportModal">
                      <CloudUploadOutlined /> Import
                    </a-button>
                    <a-button type="primary" class="premium-btn-small" @click="openAddContactModal">
                      <PlusOutlined /> Add Contact
                    </a-button>
                  </div>
                </div>

                <!-- Bulk Actions Bar -->
                <div v-if="selectedPhonebookRowKeys.length > 0" style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 10px 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                  <span style="font-size: 14px; font-weight: 500; color: #0369a1;">
                    Bulk Actions ({{ selectedPhonebookRowKeys.length }} selected):
                  </span>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <!-- Change Group selector -->
                    <a-select 
                      placeholder="Move to Group..." 
                      style="width: 160px; text-align: left;"
                      size="small"
                      @change="bulkMoveContacts"
                      value=""
                    >
                      <a-select-option value="">-- Move to... --</a-select-option>
                      <a-select-option v-for="grp in groups" :key="grp" :value="grp">
                        {{ grp }}
                      </a-select-option>
                    </a-select>

                    <!-- Bulk Delete Button -->
                    <a-popconfirm
                      title="Delete all selected contacts?"
                      ok-text="Yes"
                      cancel-text="No"
                      @confirm="bulkDeleteContacts"
                    >
                      <a-button type="primary" danger size="small" style="border-radius: 6px;">
                        <DeleteOutlined /> Delete Selected
                      </a-button>
                    </a-popconfirm>
                  </div>
                </div>

                <a-table 
                  :dataSource="filteredPhonebookContacts" 
                  :columns="phonebookColumns" 
                  size="small"
                  :row-selection="{ selectedRowKeys: selectedPhonebookRowKeys, onChange: onPhonebookSelectChange }"
                  :pagination="phonebookPagination"
                  @change="handlePhonebookTableChange"
                  :scroll="{ x: 'max-content' }"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'phone'">
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span>{{ record.phone }}</span>
                        <a-tag v-if="!isMobileNumber(record.phone)" color="red" style="border-radius: 4px; font-size: 11px; padding: 0 4px;">Non-Mobile</a-tag>
                      </div>
                    </template>
                    <template v-if="column.key === 'groups'">
                      <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                        <a-tag v-for="grp in (record.groups || [])" :key="grp" color="blue" style="border-radius: 6px;">
                          {{ grp }}
                        </a-tag>
                      </div>
                    </template>
                    <template v-if="column.key === 'actions'">
                      <div style="display: flex; gap: 8px;">
                        <a-button type="link" size="small" style="padding: 0;" @click="openEditContactModal(record)">
                          <EditOutlined /> Edit
                        </a-button>
                        <a-popconfirm
                          title="Delete this contact?"
                          ok-text="Yes"
                          cancel-text="No"
                          @confirm="handleDeleteContact(record.key)"
                        >
                          <a-button type="link" danger size="small" style="padding: 0;">
                            <DeleteOutlined /> Delete
                          </a-button>
                        </a-popconfirm>
                      </div>
                    </template>
                  </template>
                </a-table>
              </a-col>
            </a-row>
          </div>
        </a-tab-pane>
      </a-tabs>

      <!-- Add/Edit Contact Modal -->
      <a-modal
        v-model:open="isContactModalVisible"
        :title="editingContactKey ? 'Edit Contact' : 'Add New Contact'"
        @ok="handleSaveContact"
        :confirmLoading="modalLoading"
        destroyOnClose
      >
        <a-form layout="vertical" style="margin-top: 10px;">
          <a-form-item label="Name" required>
            <a-input v-model:value="contactForm.name" placeholder="John Doe" />
          </a-form-item>
          <a-form-item label="Phone Number" required>
            <a-input v-model:value="contactForm.phone" placeholder="e.g. 0771234567" />
          </a-form-item>
          <a-form-item label="Groups" required>
            <a-select v-model:value="contactForm.groups" mode="multiple" placeholder="Select Groups">
              <a-select-option v-for="grp in groups" :key="grp" :value="grp">
                {{ grp }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-form>
      </a-modal>

      <!-- Router Configuration Modal -->
      <a-modal
        v-model:open="isSettingsModalVisible"
        title="Router Configuration"
        ok-text="Save"
        cancel-text="Cancel"
        @ok="handleSaveConfig"
        destroyOnClose
      >
        <a-form layout="vertical" style="margin-top: 15px;">
          <a-form-item label="Router IP Address" required>
            <a-input v-model:value="credentials.routerIp" placeholder="192.168.8.1">
              <template #prefix><ApiOutlined style="color: rgba(0,0,0,.25)" /></template>
            </a-input>
          </a-form-item>
          <a-form-item label="Username" required>
            <a-input v-model:value="credentials.username" placeholder="admin">
              <template #prefix><UserOutlined style="color: rgba(0,0,0,.25)" /></template>
            </a-input>
          </a-form-item>
          <a-form-item label="Password" required>
            <a-input-password v-model:value="credentials.password" placeholder="••••••••">
              <template #prefix><LockOutlined style="color: rgba(0,0,0,.25)" /></template>
            </a-input-password>
          </a-form-item>
        </a-form>
      </a-modal>

      <!-- Import Contacts Modal -->
      <a-modal
        v-model:open="isImportModalVisible"
        title="Import Contacts to Phone Book"
        @ok="handleImportContacts"
        :confirmLoading="importLoading"
        destroyOnClose
      >
        <a-form layout="vertical" style="margin-top: 15px;">
          <a-form-item label="Target Groups" required>
            <a-select v-model:value="importForm.groups" mode="multiple" placeholder="Select Groups">
              <a-select-option v-for="grp in groups" :key="grp" :value="grp">
                {{ grp }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="Select File (CSV, VCF, or TXT)" required>
            <a-upload-dragger
              name="file"
              :multiple="false"
              :before-upload="handleImportFileUpload"
              accept=".csv,.vcf,.txt"
              :showUploadList="true"
              :maxCount="1"
            >
              <p class="ant-upload-drag-icon">
                <CloudUploadOutlined style="color: #11998e;" />
              </p>
              <p class="ant-upload-text">Click or drag file to parse</p>
            </a-upload-dragger>
          </a-form-item>

          <a-form-item style="margin-bottom: 8px;">
            <a-checkbox v-model:checked="importSkipDuplicates">
              Skip duplicate phone numbers
            </a-checkbox>
          </a-form-item>
          <a-form-item style="margin-bottom: 16px;">
            <a-checkbox v-model:checked="importSkipNonMobile">
              Skip non-mobile phone numbers
            </a-checkbox>
          </a-form-item>

          <div v-if="importForm.parsedList.length > 0" style="margin-top: 12px; padding: 10px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; color: #15803d; font-weight: 500;">
            Parsed {{ importForm.parsedList.length }} contacts. Ready to import.
          </div>
        </a-form>
      </a-modal>
    </a-card>
  </div>
</div>
</template>

<script setup>
import { reactive, ref, onMounted, computed, watch } from 'vue';
import { message } from 'ant-design-vue';
import { 
  UserOutlined, LockOutlined, ApiOutlined, PhoneOutlined, 
  MessageOutlined, TeamOutlined, CloudUploadOutlined, CloudDownloadOutlined,
  LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined, RocketOutlined,
  HistoryOutlined, DeleteOutlined, ContactsOutlined, FolderOutlined, PlusOutlined,
  EditOutlined, SettingOutlined, InboxOutlined, SyncOutlined, SearchOutlined
} from '@ant-design/icons-vue';
import axios from 'axios';
import Papa from 'papaparse';

const activeTab = ref('single');
const loading = ref(false);

const isMobileNumber = (phone) => {
  if (!phone) return false;
  const cleanPhone = phone.trim().replace(/[^\d+]/g, '');
  
  if (cleanPhone.startsWith('+94')) {
    return /^\+947[0-9]\d{7}$/.test(cleanPhone);
  }
  if (cleanPhone.startsWith('94')) {
    return /^947[0-9]\d{7}$/.test(cleanPhone);
  }
  if (cleanPhone.startsWith('0')) {
    return /^07[0-9]\d{7}$/.test(cleanPhone);
  }
  if (cleanPhone.startsWith('+')) {
    return /^\+\d{8,15}$/.test(cleanPhone);
  }
  if (/^7[0-9]\d{7}$/.test(cleanPhone)) {
    return true;
  }
  return false;
};

const credentials = reactive({
  routerIp: '192.168.8.1',
  username: 'admin',
  password: '',
});

const singleForm = reactive({
  phone: '',
  content: '',
});

const bulkForm = reactive({
  content: '',
});

const getSmsInfo = (text) => {
  if (!text) return { length: 0, parts: 0, limit: 160, encoding: 'GSM-7' };
  
  // Standard GSM-7 character set check
  const gsm7Regexp = /^[A-Za-z0-9@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\[~\]|€]*$/;
  
  const hasUnicode = !gsm7Regexp.test(text);
  const extendedChars = /[\^{}\\[~\]|€]/g;
  let len = text.length;
  
  if (hasUnicode) {
    const limit = 70;
    const parts = len <= 70 ? (len > 0 ? 1 : 0) : Math.ceil(len / 67);
    return { length: len, parts, limit, encoding: 'Unicode' };
  } else {
    const cleanText = text.replace(extendedChars, '  ');
    const totalLen = cleanText.length;
    const limit = 160;
    const parts = totalLen <= 160 ? (totalLen > 0 ? 1 : 0) : Math.ceil(totalLen / 153);
    return { length: totalLen, parts, limit, encoding: 'GSM-7' };
  }
};

const contacts = ref([]);
const selectedRowKeys = ref([]);
const onSelectChange = (keys) => {
  selectedRowKeys.value = keys;
};
const bulkProgress = reactive({ current: 0, total: 0, success: 0, failed: 0 });

const history = ref([]);

const isSettingsModalVisible = ref(false);

const handleSaveConfig = async () => {
  if (!credentials.routerIp || !credentials.username) {
    message.error('Router IP and Username are required.');
    return;
  }
  try {
    await axios.post('http://localhost:3001/api/config', credentials);
    message.success('Router configuration saved.');
    isSettingsModalVisible.value = false;
  } catch (error) {
    console.error('Failed to save config:', error);
    message.error('Failed to save router configuration.');
  }
};

// Inbox State
const inboxMessages = ref([]);
const inboxLoading = ref(false);
const inboxSearchQuery = ref('');
const selectedInboxRowKeys = ref([]);
const onInboxSelectChange = (keys) => {
  selectedInboxRowKeys.value = keys;
};
const inboxColumns = [
  { title: 'Sender', dataIndex: 'Phone', key: 'phone', width: '170px' },
  { title: 'Message', key: 'content' },
  { title: 'Date', dataIndex: 'Date', key: 'date', width: '160px', sorter: (a, b) => new Date(a.Date) - new Date(b.Date) },
  { title: 'Actions', key: 'actions', width: '120px', align: 'center' }
];

// Phone Book State
const showAddGroupInput = ref(false);
const newGroupName = ref('');
const selectedGroupFilter = ref('All');
const phonebookSearchQuery = ref('');
const selectedImportGroups = ref([]);

const groups = ref(['General', 'Work', 'Family']);
const phonebook = ref([]);

const selectedPhonebookRowKeys = ref([]);
const onPhonebookSelectChange = (keys) => {
  selectedPhonebookRowKeys.value = keys;
};

const phonebookPagination = reactive({
  current: 1,
  pageSize: 10,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100'],
  showTotal: (total) => `Total ${total} contacts`,
});

const handlePhonebookTableChange = (pag) => {
  phonebookPagination.current = pag.current;
  phonebookPagination.pageSize = pag.pageSize;
};

watch([selectedGroupFilter, phonebookSearchQuery], () => {
  phonebookPagination.current = 1;
});

// Modal for contacts
const isContactModalVisible = ref(false);
const editingContactKey = ref(null);
const modalLoading = ref(false);
const contactForm = reactive({
  name: '',
  phone: '',
  groups: []
});

// Modal for importing contacts
const isImportModalVisible = ref(false);
const importLoading = ref(false);
const importSkipDuplicates = ref(true);
const importSkipNonMobile = ref(true);
const importForm = reactive({
  groups: [],
  parsedList: []
});

const phonebookColumns = [
  { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
  { title: 'Phone Number', dataIndex: 'phone', key: 'phone' },
  { title: 'Groups', dataIndex: 'groups', key: 'groups', width: '200px' },
  { title: 'Actions', key: 'actions', width: '150px' }
];

const getGroupContactCount = (groupName) => {
  return phonebook.value.filter(c => Array.isArray(c.groups) && c.groups.includes(groupName)).length;
};

const saveGroupsOnServer = async () => {
  try {
    await axios.post('http://localhost:3001/api/groups', { groups: groups.value });
  } catch (error) {
    console.error('Failed to sync groups to server:', error);
  }
};

const savePhonebookOnServer = async () => {
  try {
    await axios.post('http://localhost:3001/api/phonebook', { phonebook: phonebook.value });
  } catch (error) {
    console.error('Failed to sync phonebook to server:', error);
  }
};

const saveHistoryOnServer = async () => {
  try {
    await axios.post('http://localhost:3001/api/history', { history: history.value });
  } catch (error) {
    console.error('Failed to sync history to server:', error);
  }
};

const handleAddGroup = () => {
  const name = newGroupName.value.trim();
  if (!name) {
    message.error('Group name cannot be empty.');
    return;
  }
  if (name.toLowerCase() === 'all') {
    message.error('"All" is a reserved group name.');
    return;
  }
  if (groups.value.includes(name)) {
    message.error('Group already exists.');
    return;
  }
  groups.value.push(name);
  saveGroupsOnServer();
  newGroupName.value = '';
  showAddGroupInput.value = false;
  message.success(`Group "${name}" created.`);
};

const handleDeleteGroup = (groupName) => {
  groups.value = groups.value.filter(g => g !== groupName);
  saveGroupsOnServer();
  
  phonebook.value.forEach(contact => {
    if (Array.isArray(contact.groups)) {
      contact.groups = contact.groups.filter(g => g !== groupName);
      if (contact.groups.length === 0) {
        contact.groups = ['General'];
      }
    }
  });
  savePhonebookOnServer();
  
  if (selectedGroupFilter.value === groupName) {
    selectedGroupFilter.value = 'All';
  }
  message.success(`Group "${groupName}" deleted. Contacts updated.`);
};

const filteredPhonebookContacts = computed(() => {
  let list = phonebook.value;
  if (selectedGroupFilter.value !== 'All') {
    list = list.filter(c => Array.isArray(c.groups) && c.groups.includes(selectedGroupFilter.value));
  }
  const query = phonebookSearchQuery.value.trim().toLowerCase();
  if (query) {
    list = list.filter(c => {
      const nameMatch = c.name && c.name.toLowerCase().includes(query);
      const phoneMatch = c.phone && c.phone.includes(query);
      const groupMatch = Array.isArray(c.groups) && c.groups.some(g => g.toLowerCase().includes(query));
      return nameMatch || phoneMatch || groupMatch;
    });
  }
  return list;
});

const openAddContactModal = () => {
  editingContactKey.value = null;
  contactForm.name = '';
  contactForm.phone = '';
  contactForm.groups = [groups.value[0] || 'General'];
  isContactModalVisible.value = true;
};

const openImportModal = () => {
  importForm.groups = [groups.value[0] || 'General'];
  importForm.parsedList = [];
  isImportModalVisible.value = true;
};

const handleImportFileUpload = (file) => {
  const isCSV = file.name.endsWith('.csv');
  const isVCF = file.name.endsWith('.vcf');
  const isTXT = file.name.endsWith('.txt');
  
  if (!isCSV && !isVCF && !isTXT) {
    message.error('You can only upload CSV, VCF, or TXT files!');
    return false;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    let parsed = [];
    if (isCSV) {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          parsed = results.data
            .filter(row => row.phone)
            .map(row => ({
              name: row.name ? row.name.trim() : 'Unknown',
              phone: String(row.phone).trim().replace(/[^\d+]/g, '')
            }));
          importForm.parsedList = parsed;
          message.success(`Parsed ${parsed.length} contacts from CSV.`);
        }
      });
    } else if (isVCF) {
      const vcards = content.split(/BEGIN:VCARD/i).slice(1);
      vcards.forEach(vcard => {
        let nameMatch = vcard.match(/^FN:(.*)$/im);
        if (!nameMatch) nameMatch = vcard.match(/^N:.*;(.*);.*;.*;.*$/im);
        const phoneMatch = vcard.match(/^TEL[^\:]*\:(.*)$/im);
        if (phoneMatch) {
          parsed.push({
            name: nameMatch ? nameMatch[1].trim() : 'Unknown',
            phone: phoneMatch[1].trim().replace(/[^\d+]/g, '')
          });
        }
      });
      importForm.parsedList = parsed;
      message.success(`Parsed ${parsed.length} contacts from VCF.`);
    } else if (isTXT) {
      const lines = content.split(/\r?\n/);
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed) {
          let name = 'Unknown';
          let phone = trimmed;
          if (trimmed.includes(',')) {
            const parts = trimmed.split(',');
            name = parts[0].trim();
            phone = parts.slice(1).join(',').trim();
          }
          parsed.push({
            name: name,
            phone: phone.replace(/[^\d+]/g, '')
          });
        }
      });
      importForm.parsedList = parsed;
      message.success(`Parsed ${parsed.length} contacts from TXT.`);
    }
  };
  reader.readAsText(file);
  return false;
};

const handleImportContacts = () => {
  if (importForm.parsedList.length === 0) {
    message.error('Please upload a valid contacts file first.');
    return;
  }
  
  if (!importForm.groups || importForm.groups.length === 0) {
    message.error('Please select at least one target group.');
    return;
  }

  importLoading.value = true;
  let addedCount = 0;
  let skippedDuplicatesCount = 0;
  let skippedNonMobileCount = 0;

  importForm.parsedList.forEach(item => {
    if (importSkipNonMobile.value && !isMobileNumber(item.phone)) {
      skippedNonMobileCount++;
      return;
    }

    const exists = phonebook.value.some(c => c.phone === item.phone);
    if (exists && importSkipDuplicates.value) {
      skippedDuplicatesCount++;
    } else {
      phonebook.value.push({
        key: (Date.now() + Math.random()).toString(),
        name: item.name,
        phone: item.phone,
        groups: [...importForm.groups]
      });
      addedCount++;
    }
  });

  savePhonebookOnServer();
  let statusMsg = `Imported ${addedCount} contacts.`;
  if (skippedDuplicatesCount > 0) statusMsg += ` Skipped ${skippedDuplicatesCount} duplicate(s).`;
  if (skippedNonMobileCount > 0) statusMsg += ` Skipped ${skippedNonMobileCount} non-mobile number(s).`;
  message.success(statusMsg);
  
  isImportModalVisible.value = false;
  importLoading.value = false;
};

const openEditContactModal = (record) => {
  editingContactKey.value = record.key;
  contactForm.name = record.name;
  contactForm.phone = record.phone;
  contactForm.groups = Array.isArray(record.groups) ? [...record.groups] : (record.group ? [record.group] : ['General']);
  isContactModalVisible.value = true;
};

const handleSaveContact = () => {
  const name = contactForm.name.trim();
  const phone = contactForm.phone.trim().replace(/[^\d+]/g, '');
  const selectedGroups = contactForm.groups;

  if (!name || !phone) {
    message.error('Name and Phone Number are required.');
    return;
  }

  if (!isMobileNumber(phone)) {
    message.error('Please enter a valid mobile number.');
    return;
  }

  if (!selectedGroups || selectedGroups.length === 0) {
    message.error('At least one group must be selected.');
    return;
  }

  // Check for duplicate phone number (excluding the current contact being edited)
  const isDuplicate = phonebook.value.some(c => c.phone === phone && c.key !== editingContactKey.value);
  if (isDuplicate) {
    message.error(`A contact with the phone number "${phone}" already exists.`);
    return;
  }

  modalLoading.value = true;
  
  if (editingContactKey.value) {
    const idx = phonebook.value.findIndex(c => c.key === editingContactKey.value);
    if (idx !== -1) {
      phonebook.value[idx].name = name;
      phonebook.value[idx].phone = phone;
      phonebook.value[idx].groups = [...selectedGroups];
      if (phonebook.value[idx].group !== undefined) {
        delete phonebook.value[idx].group;
      }
      message.success('Contact updated.');
    }
  } else {
    phonebook.value.push({
      key: Date.now().toString(),
      name,
      phone,
      groups: [...selectedGroups]
    });
    message.success('Contact added.');
  }

  savePhonebookOnServer();
  isContactModalVisible.value = false;
  modalLoading.value = false;
};

const handleDeleteContact = (key) => {
  phonebook.value = phonebook.value.filter(c => c.key !== key);
  savePhonebookOnServer();
  selectedPhonebookRowKeys.value = selectedPhonebookRowKeys.value.filter(k => k !== key);
  message.success('Contact deleted.');
};

const sendPhonebookToBroadcast = () => {
  const selectedContacts = phonebook.value.filter(c => selectedPhonebookRowKeys.value.includes(c.key));
  if (selectedContacts.length === 0) return;
  
  const mapped = selectedContacts.map((c, index) => ({
    key: index,
    name: c.name,
    phone: c.phone,
    status: 'pending'
  }));

  contacts.value = mapped;
  selectedRowKeys.value = mapped.map(m => m.key);
  
  selectedImportGroups.value = []; // Reset selected groups dropdown
  message.success(`Sent ${mapped.length} contacts to Broadcast.`);
  activeTab.value = 'bulk';
  selectedPhonebookRowKeys.value = [];
};

const bulkDeleteContacts = () => {
  if (selectedPhonebookRowKeys.value.length === 0) return;
  
  phonebook.value = phonebook.value.filter(c => !selectedPhonebookRowKeys.value.includes(c.key));
  savePhonebookOnServer();
  
  message.success(`Successfully deleted ${selectedPhonebookRowKeys.value.length} contacts.`);
  selectedPhonebookRowKeys.value = [];
};

const bulkMoveContacts = (targetGroup) => {
  if (!targetGroup || selectedPhonebookRowKeys.value.length === 0) return;

  phonebook.value.forEach(contact => {
    if (selectedPhonebookRowKeys.value.includes(contact.key)) {
      contact.groups = [targetGroup];
      if (contact.group !== undefined) {
        delete contact.group;
      }
    }
  });

  savePhonebookOnServer();
  message.success(`Moved ${selectedPhonebookRowKeys.value.length} contacts to group "${targetGroup}".`);
  selectedPhonebookRowKeys.value = [];
};

const removeNonMobileContacts = () => {
  const initialCount = phonebook.value.length;
  phonebook.value = phonebook.value.filter(c => isMobileNumber(c.phone));
  const removed = initialCount - phonebook.value.length;
  
  if (removed > 0) {
    savePhonebookOnServer();
    selectedPhonebookRowKeys.value = selectedPhonebookRowKeys.value.filter(k => 
      phonebook.value.some(c => c.key === k)
    );
    message.success(`Successfully removed ${removed} non-mobile contact(s).`);
  } else {
    message.info('No non-mobile contact numbers found.');
  }
};

const removeNonMobileFromPreview = () => {
  const initialCount = contacts.value.length;
  contacts.value = contacts.value.filter(c => isMobileNumber(c.phone));
  selectedRowKeys.value = selectedRowKeys.value.filter(k => {
    const contact = contacts.value.find(c => c.key === k);
    return contact && isMobileNumber(contact.phone);
  });
  const removed = initialCount - contacts.value.length;
  message.success(`Removed ${removed} non-mobile contact(s) from preview.`);
};

const exportAllContacts = () => {
  if (phonebook.value.length === 0) {
    message.warning('No contacts to export.');
    return;
  }

  const headers = ['name', 'phone', 'groups'];
  const csvContent = [
    headers.join(','),
    ...phonebook.value.map(c => {
      const escapedName = `"${c.name.replace(/"/g, '""')}"`;
      const escapedPhone = `"${c.phone.replace(/"/g, '""')}"`;
      const escapedGroups = `"${(Array.isArray(c.groups) ? c.groups.join(', ') : '').replace(/"/g, '""')}"`;
      return [escapedName, escapedPhone, escapedGroups].join(',');
    })
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `contacts_export_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  message.success('Contacts exported successfully!');
};

const deleteAllContacts = async () => {
  const count = phonebook.value.length;
  if (count === 0) {
    message.info('The phone book is already empty.');
    return;
  }
  
  phonebook.value = [];
  selectedPhonebookRowKeys.value = [];
  await savePhonebookOnServer();
  message.success(`Successfully deleted all ${count} contacts.`);
};

const importGroupsToBroadcast = (selectedGroups) => {
  if (!selectedGroups || selectedGroups.length === 0) {
    contacts.value = [];
    selectedRowKeys.value = [];
    return;
  }

  const mergedMap = new Map();

  selectedGroups.forEach(groupVal => {
    let sourceContacts = [];
    if (groupVal === 'All') {
      sourceContacts = phonebook.value;
    } else {
      sourceContacts = phonebook.value.filter(c => Array.isArray(c.groups) && c.groups.includes(groupVal));
    }
    
    sourceContacts.forEach(c => {
      if (!mergedMap.has(c.phone)) {
        mergedMap.set(c.phone, {
          name: c.name,
          phone: c.phone
        });
      }
    });
  });

  const mergedList = Array.from(mergedMap.values()).map((c, index) => ({
    key: index,
    name: c.name,
    phone: c.phone,
    status: 'pending'
  }));

  contacts.value = mergedList;
  selectedRowKeys.value = mergedList.map(m => m.key);
  message.success(`Imported ${mergedList.length} unique contacts from selected groups.`);
};

const fetchInbox = async () => {
  if (!credentials.password) {
    message.error('Please configure router credentials (password) first.');
    return;
  }

  inboxLoading.value = true;
  try {
    const response = await axios.post('http://localhost:3001/api/received-sms', {
      routerIp: credentials.routerIp,
      username: credentials.username,
      password: credentials.password
    });
    if (response.data && response.data.success) {
      inboxMessages.value = response.data.messages;
      message.success(`Retrieved ${response.data.messages.length} messages.`);
    } else {
      message.error(response.data.error || 'Failed to retrieve inbox.');
    }
  } catch (error) {
    console.error(error);
    const errorMsg = error.response?.data?.error || error.message || 'Network error.';
    message.error(`Error: ${errorMsg}`);
  } finally {
    inboxLoading.value = false;
  }
};

const replyToMessage = (record) => {
  singleForm.phone = record.Phone || '';
  singleForm.content = '';
  activeTab.value = 'single';
  message.info(`Replying to ${record.Phone}`);
};

const handleDeleteInboxMessage = async (key) => {
  try {
    inboxLoading.value = true;
    const response = await axios.post('http://localhost:3001/api/inbox/delete', {
      key,
      routerIp: credentials.routerIp,
      username: credentials.username,
      password: credentials.password
    });
    if (response.data && response.data.success) {
      inboxMessages.value = inboxMessages.value.filter(m => m.key !== key);
      message.success('Message deleted.');
      selectedInboxRowKeys.value = selectedInboxRowKeys.value.filter(k => k !== key);
    } else {
      message.error(response.data.error || 'Failed to delete message.');
    }
  } catch (error) {
    console.error(error);
    message.error('Failed to delete message: Network error.');
  } finally {
    inboxLoading.value = false;
  }
};

const filteredInboxMessages = computed(() => {
  let list = inboxMessages.value || [];
  const query = inboxSearchQuery.value.trim().toLowerCase();
  if (query) {
    list = list.filter(m => {
      const senderMatch = m.Phone && m.Phone.toLowerCase().includes(query);
      const contentMatch = m.Content && m.Content.toLowerCase().includes(query);
      return senderMatch || contentMatch;
    });
  }
  return list;
});

const bulkDeleteInboxMessages = async () => {
  if (selectedInboxRowKeys.value.length === 0) return;
  
  try {
    inboxLoading.value = true;
    const response = await axios.post('http://localhost:3001/api/inbox/bulk-delete', {
      keys: selectedInboxRowKeys.value,
      routerIp: credentials.routerIp,
      username: credentials.username,
      password: credentials.password
    });
    if (response.data && response.data.success) {
      inboxMessages.value = inboxMessages.value.filter(m => !selectedInboxRowKeys.value.includes(m.key));
      message.success(`Successfully deleted ${selectedInboxRowKeys.value.length} messages.`);
      selectedInboxRowKeys.value = [];
    } else {
      message.error(response.data.error || 'Failed to delete selected messages.');
    }
  } catch (error) {
    console.error(error);
    message.error('Failed to delete messages: Network error.');
  } finally {
    inboxLoading.value = false;
  }
};

watch(activeTab, (newTab) => {
  if (newTab === 'inbox' && credentials.password && inboxMessages.value.length === 0) {
    fetchInbox();
  }
});

onMounted(async () => {
  try {
    const configRes = await axios.get('http://localhost:3001/api/config');
    if (configRes.data) {
      credentials.routerIp = configRes.data.routerIp || '192.168.8.1';
      credentials.username = configRes.data.username || 'admin';
      credentials.password = configRes.data.password || '';
    }
  } catch (err) {
    console.error('Failed to load router configuration from server:', err);
  }

  try {
    const inboxRes = await axios.get('http://localhost:3001/api/inbox');
    inboxMessages.value = inboxRes.data || [];
  } catch (err) {
    console.error('Failed to load inbox from server:', err);
  }

  try {
    const historyRes = await axios.get('http://localhost:3001/api/history');
    history.value = historyRes.data;
  } catch (err) {
    console.error('Failed to load history from server:', err);
  }

  try {
    const groupsRes = await axios.get('http://localhost:3001/api/groups');
    groups.value = groupsRes.data;
  } catch (err) {
    console.error('Failed to load groups from server:', err);
  }

  try {
    const phonebookRes = await axios.get('http://localhost:3001/api/phonebook');
    let data = phonebookRes.data || [];
    let needsMigration = false;
    data = data.map(contact => {
      // Migrate legacy string .group property to .groups array
      if (contact.group !== undefined && !Array.isArray(contact.groups)) {
        contact.groups = contact.group ? [contact.group] : ['General'];
        delete contact.group;
        needsMigration = true;
      }
      if (!Array.isArray(contact.groups)) {
        contact.groups = ['General'];
        needsMigration = true;
      }
      return contact;
    });
    phonebook.value = data;
    if (needsMigration) {
      console.log('Migrated phonebook contacts schema to support multiple groups');
      await savePhonebookOnServer();
    }
  } catch (err) {
    console.error('Failed to load phonebook from server:', err);
  }
});

const addHistory = (record) => {
  const newRecord = {
    key: Date.now().toString(),
    date: new Date().toLocaleString(),
    ...record
  };
  history.value.unshift(newRecord); // Add to top
  if (history.value.length > 50) history.value.pop(); // keep last 50
  saveHistoryOnServer();
};

const clearHistory = () => {
  history.value = [];
  saveHistoryOnServer();
  message.success('History cleared.');
};

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: 'Phone', dataIndex: 'phone', key: 'phone' },
  { title: 'Status', dataIndex: 'status', key: 'status', width: '120px' },
];

const historyColumns = [
  { title: 'Date', dataIndex: 'date', key: 'date', width: '150px' },
  { title: 'Type', dataIndex: 'type', key: 'type', width: '80px' },
  { title: 'Recipient(s)', dataIndex: 'recipient', key: 'recipient' },
  { title: 'Message', dataIndex: 'content', key: 'content', ellipsis: true },
  { title: 'Status', dataIndex: 'status', key: 'status', width: '150px' },
];

const getStatusColor = (status) => {
  if (status === 'success') return '#10b981';
  if (status === 'failed') return '#ef4444';
  if (status === 'sending...') return '#3b82f6';
  return '#94a3b8';
};

const sendApiRequest = async (phone, content) => {
  return axios.post('http://localhost:3001/api/send-sms', {
    routerIp: credentials.routerIp,
    username: credentials.username,
    password: credentials.password,
    phone,
    content
  });
};

const onSendSingle = async () => {
  if (!credentials.password || !singleForm.phone || !singleForm.content) {
    message.error('Please fill in all required fields.');
    return;
  }

  if (!isMobileNumber(singleForm.phone)) {
    message.error('Please enter a valid mobile number.');
    return;
  }
  
  loading.value = true;
  try {
    const response = await sendApiRequest(singleForm.phone, singleForm.content);
    if (response.data && response.data.success) {
      message.success('SMS Sent Successfully!');
      addHistory({
        type: 'Single',
        recipient: singleForm.phone,
        content: singleForm.content,
        status: 'Success'
      });
      singleForm.content = '';
    } else {
      message.error(response.data.error || 'Failed to send SMS.');
      addHistory({
        type: 'Single',
        recipient: singleForm.phone,
        content: singleForm.content,
        status: 'Failed'
      });
    }
  } catch (error) {
    console.error(error);
    const errorMsg = error.response?.data?.error || error.message || 'Network error.';
    message.error(`Error: ${errorMsg}`);
    addHistory({
      type: 'Single',
      recipient: singleForm.phone,
      content: singleForm.content,
      status: 'Failed (Error)'
    });
  } finally {
    loading.value = false;
  }
};

const handleFileUpload = (file) => {
  selectedImportGroups.value = [];
  const isCSV = file.name.endsWith('.csv');
  const isVCF = file.name.endsWith('.vcf');
  const isTXT = file.name.endsWith('.txt');
  
  if (!isCSV && !isVCF && !isTXT) {
    message.error('You can only upload CSV, VCF, or TXT files!');
    return false;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    if (isCSV) {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedContacts = results.data
            .filter(row => row.phone) // must have phone
            .map((row, index) => ({
              key: index,
              name: row.name ? row.name.trim() : 'Unknown',
              phone: String(row.phone).trim(),
              status: 'pending'
            }));
          contacts.value = parsedContacts;
          selectedRowKeys.value = parsedContacts.map(c => c.key);
          message.success(`Loaded ${parsedContacts.length} contacts`);
        }
      });
    } else if (isVCF) {
      const parsedContacts = [];
      const vcards = content.split(/BEGIN:VCARD/i).slice(1);
      
      vcards.forEach((vcard, index) => {
        let nameMatch = vcard.match(/^FN:(.*)$/im);
        if (!nameMatch) nameMatch = vcard.match(/^N:.*;(.*);.*;.*;.*$/im);
        
        const phoneMatch = vcard.match(/^TEL[^\:]*\:(.*)$/im);
        
        if (phoneMatch) {
          parsedContacts.push({
            key: index,
            name: nameMatch ? nameMatch[1].trim() : 'Unknown',
            phone: phoneMatch[1].trim().replace(/[^\d+]/g, ''), // clean phone
            status: 'pending'
          });
        }
      });
      contacts.value = parsedContacts;
      selectedRowKeys.value = parsedContacts.map(c => c.key);
      message.success(`Loaded ${parsedContacts.length} contacts`);
    } else if (isTXT) {
      const parsedContacts = [];
      const lines = content.split(/\r?\n/);
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed) {
          let name = 'Unknown';
          let phone = trimmed;
          if (trimmed.includes(',')) {
            const parts = trimmed.split(',');
            name = parts[0].trim();
            phone = parts.slice(1).join(',').trim();
          }
          parsedContacts.push({
            key: index,
            name: name,
            phone: phone.replace(/[^\d+]/g, ''),
            status: 'pending'
          });
        }
      });
      contacts.value = parsedContacts;
      selectedRowKeys.value = parsedContacts.map(c => c.key);
      message.success(`Loaded ${parsedContacts.length} contacts`);
    }
  };
  reader.readAsText(file);
  return false; // Prevent auto upload
};

const startBulkSend = async () => {
  const selectedContacts = contacts.value.filter(c => selectedRowKeys.value.includes(c.key));
  if (!credentials.password || selectedContacts.length === 0 || !bulkForm.content) {
    message.error('Please ensure credentials, selected contacts, and message content are ready.');
    return;
  }

  loading.value = true;
  bulkProgress.total = selectedContacts.length;
  bulkProgress.current = 0;
  bulkProgress.success = 0;
  bulkProgress.failed = 0;

  for (let i = 0; i < selectedContacts.length; i++) {
    const contact = selectedContacts[i];
    contact.status = 'sending...';
    bulkProgress.current = i + 1;
    
    // Personalize message
    let personalizedContent = bulkForm.content.replace(/\{name\}/gi, contact.name !== 'Unknown' ? contact.name : '');
    
    try {
      const response = await sendApiRequest(contact.phone, personalizedContent);
      if (response.data && response.data.success) {
        contact.status = 'success';
        bulkProgress.success++;
      } else {
        contact.status = 'failed';
        bulkProgress.failed++;
      }
    } catch (error) {
      contact.status = 'failed';
      bulkProgress.failed++;
    }
    
    // Pause for 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  loading.value = false;
  message.success('Broadcast Complete!');
  
  addHistory({
    type: 'Bulk',
    recipient: `${bulkProgress.total} Contacts`,
    content: bulkForm.content,
    status: `Completed (${bulkProgress.success} Success, ${bulkProgress.failed} Failed)`
  });
};
</script>
