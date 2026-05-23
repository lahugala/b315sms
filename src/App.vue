<template>
  <div style="padding: 40px 15px; min-height: 100vh; width: 100%;">
    <a-card class="glass-card" :style="{ width: '100%', maxWidth: '900px', margin: '0 auto' }">
      <template #cover>
        <div style="text-align: center; padding-top: 32px;">
          <a-typography-title :level="2" class="title-gradient">
            Huawei Connect
          </a-typography-title>
          <div class="subtitle">Professional SMS Broadcasting Portal</div>
        </div>
      </template>

      <!-- Common Credentials -->
      <a-form layout="vertical">
        <a-divider style="margin-top: 0; color: #94a3b8; font-weight: 500; font-size: 14px;">ROUTER CONFIGURATION</a-divider>
        <a-row :gutter="20">
          <a-col :span="24">
            <a-form-item label="Router IP Address" required>
              <a-input v-model:value="credentials.routerIp" placeholder="192.168.8.1">
                <template #prefix><ApiOutlined style="color: rgba(0,0,0,.25)" /></template>
              </a-input>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12">
            <a-form-item label="Username" required>
              <a-input v-model:value="credentials.username" placeholder="admin">
                <template #prefix><UserOutlined style="color: rgba(0,0,0,.25)" /></template>
              </a-input>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12">
            <a-form-item label="Password" required>
              <a-input-password v-model:value="credentials.password" placeholder="••••••••">
                <template #prefix><LockOutlined style="color: rgba(0,0,0,.25)" /></template>
              </a-input-password>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>

      <a-tabs v-model:activeKey="activeTab" centered style="margin-top: 10px;">
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
            <a-upload-dragger
              name="file"
              :multiple="false"
              :before-upload="handleFileUpload"
              accept=".csv,.vcf,.txt"
              :showUploadList="false"
            >
              <p class="ant-upload-drag-icon">
                <CloudUploadOutlined style="color: #11998e;" />
              </p>
              <p class="ant-upload-text" style="font-weight: 600; font-size: 16px;">Click or drag file to upload contacts</p>
              <p class="ant-upload-hint" style="color: #64748b;">
                Support for <strong>CSV</strong> (name, phone), <strong>VCF</strong> (v2.1+), and <strong>TXT</strong> files.
              </p>
            </a-upload-dragger>
          </div>

          <div v-if="contacts.length > 0" style="margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-weight: 600; font-size: 15px; color: #334155;">Contact List Preview</span>
              <a-badge :count="contacts.length" :number-style="{ backgroundColor: '#11998e' }" />
            </div>
            
            <!-- Scrolled Table -->
            <a-table 
              :dataSource="contacts" 
              :columns="columns" 
              size="small" 
              :pagination="false"
              :scroll="{ x: 'max-content', y: 250 }"
              bordered
            >
              <template #bodyCell="{ column, record }">
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
              <a-button @click="startBulkSend" block :loading="loading" :disabled="contacts.length === 0 || !bulkForm.content" class="premium-btn">
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
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { 
  UserOutlined, LockOutlined, ApiOutlined, PhoneOutlined, 
  MessageOutlined, TeamOutlined, CloudUploadOutlined, 
  LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined, RocketOutlined,
  HistoryOutlined, DeleteOutlined
} from '@ant-design/icons-vue';
import axios from 'axios';
import Papa from 'papaparse';

const activeTab = ref('single');
const loading = ref(false);

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

const contacts = ref([]);
const bulkProgress = reactive({ current: 0, total: 0, success: 0, failed: 0 });

const history = ref([]);

onMounted(() => {
  const savedHistory = localStorage.getItem('sms_history');
  if (savedHistory) {
    history.value = JSON.parse(savedHistory);
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
  localStorage.setItem('sms_history', JSON.stringify(history.value));
};

const clearHistory = () => {
  history.value = [];
  localStorage.removeItem('sms_history');
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
      message.success(`Loaded ${parsedContacts.length} contacts`);
    }
  };
  reader.readAsText(file);
  return false; // Prevent auto upload
};

const startBulkSend = async () => {
  if (!credentials.password || contacts.value.length === 0 || !bulkForm.content) {
    message.error('Please ensure credentials, contacts, and message content are ready.');
    return;
  }

  loading.value = true;
  bulkProgress.total = contacts.value.length;
  bulkProgress.current = 0;
  bulkProgress.success = 0;
  bulkProgress.failed = 0;

  for (let i = 0; i < contacts.value.length; i++) {
    const contact = contacts.value[i];
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
