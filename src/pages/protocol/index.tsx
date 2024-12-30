import React, { useState, useEffect } from 'react';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { Button } from 'antd';
import { EditorState, convertToRaw, convertFromRaw, convertFromHTML, ContentState } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import Layout from '@/components/Layout';
import { get, post } from '@/services/request';

const ProtocolEditor: React.FC = () => {
  const [regulationContent, setRegulationContent] = useState(EditorState.createEmpty());
  const [agreementContent, setAgreementContent] = useState(EditorState.createEmpty());
  const [isClient, setIsClient] = useState(false);
  const [Editor, setEditor] = useState<any>(null);

  useEffect(() => {
    // 确保代码只在客户端执行
    setIsClient(typeof window !== 'undefined');
    if (isClient) {
      const { Editor: WysiwygEditor } = require('react-draft-wysiwyg');
      setEditor(() => WysiwygEditor);

      // 新增：获取当前协议内容
      const fetchCurrentProtocol = async () => {
        try {
          const response = await get('/protocols/current'); // 假设有一个接口获取当前协议
          const { data } = response; // 更新：直接获取 data
          
          // 检查数据格式是否符合要求
          if (data[0].content && data[1].content) {
            const regulationContentState = convertFromHTML(data[0].content); // 更新：将 HTML 内容转换为 ContentState
            const agreementContentState = convertFromHTML(data[1].content); // 更新：将 HTML 内容转换为 ContentState
            
            setRegulationContent(EditorState.createWithContent(ContentState.createFromBlockArray(regulationContentState.contentBlocks))); // 更新：解析内容
            setAgreementContent(EditorState.createWithContent(ContentState.createFromBlockArray(agreementContentState.contentBlocks))); // 更新：解析内容
          } else {
            console.error('获取的内容格式不正确:', data);
          }
        } catch (error) {
          console.error('获取当前协议失败:', error);
        }
      };

      fetchCurrentProtocol(); // 调用获取协议内容的函数
    }
  }, [isClient]);

  const handleSave = async (contentType: string) => {
    // 处理保存逻辑
    const content = contentType === '乘车制度' ? regulationContent : agreementContent;
    const rawContent = convertToRaw(content.getCurrentContent());
    const htmlContent = stateToHTML(content.getCurrentContent());
    
    console.log(`保存的${contentType}内容:`, htmlContent);

    try {
        const response = await post('/protocols', {
            type: contentType,
            content: htmlContent,
        }, {
            showSuccess: true,
            successMsg: `${contentType} 保存成功`
        });
        console.log('保存响应:', response);
    } catch (error) {
        console.error('保存失败:', error);
    }
  };

  if (!isClient || !Editor) {
    return null; // 或者返回一个加载指示器
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', height: '100%' }}>
        <div style={{ height: '100%', width: '50%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>求知专线乘车制度</h2>
            <Button type="primary" onClick={() => handleSave('乘车制度')}>保存</Button>
          </div>
          <br />
          <Editor
            editorState={regulationContent}
            onEditorStateChange={setRegulationContent}
            height={500}
            wrapperClassName="demo-wrapper"
            editorClassName="demo-editor"
            toolbarClassName="demo-toolbar"

          />
        </div>
        <div style={{ borderLeft: '1px solid #ccc', height: '100%' }} />
        <div style={{ height: '100%', width: '50%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>求知专线乘车公约</h2>
            <Button type="primary" onClick={() => handleSave('乘车公约')}>保存</Button>
          </div>
          <br />
          <Editor
            editorState={agreementContent}
            onEditorStateChange={setAgreementContent}
            height={500}
            wrapperClassName="demo-wrapper"
            editorClassName="demo-editor"
            toolbarClassName="demo-toolbar"

          />
        </div>
      </div>

    </Layout>
  );
};

export default ProtocolEditor;